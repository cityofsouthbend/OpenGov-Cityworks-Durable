const { app } = require('@azure/functions');
const df = require('durable-functions');

const activityName = 'Cityworks-OpenGov-Orchestrator';

df.app.orchestration('Cityworks-OpenGov-OrchestratorOrchestrator', function* (context) {
    const returnValues = [];
    // currently looks like this in CItyworks {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","AccelaCaseID":"{{Text1}}","AccelaInspectionID":"{{Text2}}"}
    // will now look like this {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","OpenGovID":"{{Text1}}","RecordName":"{{Text2}}"}
    const body = context.df.getInput() || {};
    const cwToken = yield context.df.callActivity('token');
    const attachments = yield context.df.callActivity('images', { cityworksToken: cwToken, orderNumber: body.OpenGovID });
    returnValues.push({ attachmentsFound: attachments.length });

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
            const addedFileResult  = yield context.df.callActivity('attachFile', { fileID, attachmentName });
            returnValues.push({ attachedFile: addedFileResult });
        }
    }

    // will need to update record workflow step (may be two parts - retrieve steps to get step ID and ordinal and then update step)

    return returnValues;
});



