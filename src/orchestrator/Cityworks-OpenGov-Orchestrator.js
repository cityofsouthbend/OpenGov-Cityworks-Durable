    // currently looks like this in CItyworks {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","AccelaCaseID":"{{Text1}}","AccelaInspectionID":"{{Text2}}"}
    // will now look like this {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","OpenGovID":"{{Text1}}","RecordName":"{{Text2}}"}
    // current POST API opengov-cityworks-apgbc2gth3cyftda.centralus-01.azurewebsites.net/api/orchestrators/Cityworks-OpenGov-OrchestratorOrchestrator
    // previous codemowing-ver3.azurewebsites.net/cw

const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

const activityName = 'Cityworks-OpenGov-Orchestrator';

df.app.orchestration('Cityworks-OpenGov-OrchestratorOrchestrator', function* (context) {
    // cronitor helper function 
    function sendCronitor(params) {
        return axios.get(monitorUrl, { params });
    }

    const body = context.df.getInput() || {};
    const monitorUrl = process.env.CRON_URL || null;
    const series = context.df.instanceId;

    // start cronitor
    if (!context.df.isReplaying) {
        yield sendCronitor({
            state: 'run',
            series,
            message: `Started | CityworksWOID=${body.CityworksWOID} OpenGovID=${body.OpenGovID}`
        });
    }

    // get Cityworks token
    const cwToken = yield context.df.callActivity('token');
    if (!context.df.isReplaying) {
        yield sendCronitor({
            series,
            message: 'Cityworks token retrieved'
        });
    }

    // get attachments from Cityworks work order
    const attachments = yield context.df.callActivity('images', { cityworksToken: cwToken, orderNumber: body.CityworksWOID });  
    if (!context.df.isReplaying) {
        yield sendCronitor({
            series,
            message: `Attachments found: ${attachments.length}`
        });
    }  

    // check for and process attachments from Cityworks
    if ( attachments.length > 0 ) {
        for (let attachment of attachments) {
            const attachmentId      = attachment.Id;
            const attachmentName    = "Cityworks_" + attachmentId.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}) + ".jpg";
            
            // creating attachment link in OpenGov
            const fileUploadResult  = yield context.df.callActivity('fileUpload', attachmentName);
            const fileID            = fileUploadResult.data.id;
            const uploadUrl         = fileUploadResult.data.attributes.uploadUrl;
            
            // uploading attachment to Azure Blob URL provided by OpenGov
            yield context.df.callActivity('uploadImages', { attachmentId, cwToken, uploadUrl });
            
            // linking attachment to OpenGov record
            const attachedRecord = yield context.df.callActivity('attachFile', { fileID, attachmentName, id: body.OpenGovID });
            if (!context.df.isReplaying) {
                yield sendCronitor({
                series,
                message: `Attachment added to record: ${attachedRecord.data.id}`
            });
    }  
        }
    }
    // update OpenGov record workflow step for VPA Mowing Abatement 
    const stepID = yield context.df.callActivity('workflowUpdate', { orderNumber: body.CityworksWOID, status: body.Status, id: body.OpenGovID });
    if (!context.df.isReplaying) {
        yield sendCronitor({
            state: 'complete',
            series,
            message: `Completed successfully | StepID=${stepID}`
        });
    }

    // will need to update record workflow step (may be two parts - retrieve steps to get step ID and ordinal and then update step)

    return;
});



