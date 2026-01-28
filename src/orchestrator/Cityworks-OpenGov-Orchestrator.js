const { app } = require('@azure/functions');
const df = require('durable-functions');

const activityName = 'Cityworks-OpenGov-Orchestrator';

df.app.orchestration('Cityworks-OpenGov-OrchestratorOrchestrator', function* (context) {
    const returnValues = [];
    const body = context.df.getInput() || {};
    const cwToken = yield context.df.callActivity('token');
    const attachments = yield context.df.callActivity('images', { cityworksToken: cwToken, orderNumber: body.id });
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
            // const [blobName, containerName, startFile, conDis] = yield context.df.callActivity("DownloadAttachment", [attachmentId, cwToken, accelaToken, accelaCaseID]);
            // const sendAttachmentResult       = yield context.df.callActivity("SendAttachmentToAccela", [blobName, containerName, attachmentName, accelaCaseID, accelaToken]);
        }
    }

    return returnValues;
});



