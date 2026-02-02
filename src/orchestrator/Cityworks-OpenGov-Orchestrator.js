const { app } = require('@azure/functions');
const df = require('durable-functions');

const activityName = 'Cityworks-OpenGov-Orchestrator';

df.app.orchestration('Cityworks-OpenGov-OrchestratorOrchestrator', function* (context) {
    const returnValues = [];
    // currently looks like this in CItyworks {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","AccelaCaseID":"{{Text1}}","AccelaInspectionID":"{{Text2}}"}
    // will now look like this {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","OpenGovID":"{{Text1}}","RecordName":"{{Text2}}"}
    // current POST API opengov-cityworks-apgbc2gth3cyftda.centralus-01.azurewebsites.net/api/orchestrators/Cityworks-OpenGov-OrchestratorOrchestrator
    // previous codemowing-ver3.azurewebsites.net/cw
    const body = context.df.getInput() || {};
    console.log('CW-OG ORCH Orchestrator input:', body.CityworksWOID, body.OpenGovID);
    const cwToken = yield context.df.callActivity('token');
    console.log('CW-OG ORCH Cityworks Token retrieved');
    const attachments = yield context.df.callActivity('images', { cityworksToken: cwToken, orderNumber: body.CityworksWOID });
    returnValues.push({ attachmentsFound: attachments.length });
    console.log('CW-OG ORC attachments', attachments);    

    if ( attachments.length > 0 ) {
        for (let attachment of attachments) {
            const attachmentId      = attachment.Id;
            const attachmentName    = "Cityworks_" + attachmentId.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}) + ".jpg";
            const fileUploadResult  = yield context.df.callActivity('fileUpload', attachmentName);
            const fileID            = fileUploadResult.data.id;
            const uploadUrl         = fileUploadResult.data.attributes.uploadUrl;
            returnValues.push({ uploadUrl });
            const uploadResult      = yield context.df.callActivity('uploadImages', { attachmentId, cwToken, uploadUrl });
            returnValues.push({ attachmentId, ...uploadResult });
            const addedFileResult  = yield context.df.callActivity('attachFile', { fileID, attachmentName, id: body.OpenGovID });
            returnValues.push({ attachedFile: addedFileResult });
        }
    }

    const workflowUpdate = yield context.df.callActivity('workflowUpdate', { orderNumber: body.CityworksWOID, status: body.Status, id: body.OpenGovID });
    console.log('CW-OG ORC workflowUpdate result:', workflowUpdate);
    returnValues.push({ workflowUpdate });
    // will need to update record workflow step (may be two parts - retrieve steps to get step ID and ordinal and then update step)

    return returnValues;
});



