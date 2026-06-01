// currently looks like this in CItyworks {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","AccelaCaseID":"{{Text1}}","AccelaInspectionID":"{{Text2}}"}
// will now look like this {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","OpenGovID":"{{Text1}}","RecordName":"{{Text2}}"}
// current POST API opengov-cityworks-apgbc2gth3cyftda.centralus-01.azurewebsites.net/api/orchestrators/Cityworks-OpenGov-OrchestratorOrchestrator
// previous codemowing-ver3.azurewebsites.net/cw

const { app } = require('@azure/functions');
const df = require('durable-functions');

df.app.orchestration('Cityworks-OpenGov-OrchestratorOrchestrator', function* (context) {
    const retryOptions = new df.RetryOptions(5000, 3);

    const body = context.df.getInput() || {};

    // Cronitor ping helper - injects series + replay guard so callers stay focused on state/message.
    const pingInput = (params) => ({
        enabled: !context.df.isReplaying,
        params: { series: context.df.instanceId, ...params }
    });

    try {
        // start cronitor
        yield context.df.callActivity('cronitorPing', pingInput({
            state: 'run',
            message: `Started - CityworksWOID=${body.CityworksWOID} Status=${body.Status} OpenGovID=${body.OpenGovID} RecordName=${body.RecordName}`
        }));

        // get Cityworks token
        const cwToken = yield context.df.callActivityWithRetry('token', retryOptions);
        yield context.df.callActivity('cronitorPing', pingInput({
            message: 'Cityworks token acquired'
        }));

        // get attachments from Cityworks work order
        yield context.df.callActivity('cronitorPing', pingInput({
            message: `Fetching Cityworks attachments - CityworksWOID=${body.CityworksWOID}`
        }));
        const attachments = yield context.df.callActivityWithRetry(
            'images',
            retryOptions,
            { cityworksToken: cwToken, orderNumber: body.CityworksWOID }
        );
        yield context.df.callActivity('cronitorPing', pingInput({
            message: `Attachments fetched - Count=${attachments.length}`
        }));

        // check for and process attachments from Cityworks
        if (attachments.length > 0) {
            let index = 0;
            for (let attachment of attachments) {
                index += 1;
                const attachmentId   = attachment.Id;
                const attachmentName = "Cityworks_" + attachmentId.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}) + ".jpg";

                yield context.df.callActivity('cronitorPing', pingInput({
                    message: `Processing attachment - Index=${index}/${attachments.length} AttachmentID=${attachmentId} Name=${attachmentName}`
                }));

                // creating attachment link in OpenGov
                const fileUploadResult = yield context.df.callActivityWithRetry(
                    'fileUpload',
                    retryOptions,
                    attachmentName
                );
                const fileID    = fileUploadResult.data.id;
                const uploadUrl = fileUploadResult.data.attributes.uploadUrl;
                yield context.df.callActivity('cronitorPing', pingInput({
                    message: `OpenGov file placeholder created - FileID=${fileID}`
                }));

                // uploading attachment to Azure Blob URL provided by OpenGov
                const uploadResult = yield context.df.callActivityWithRetry(
                    'uploadImages',
                    retryOptions,
                    { attachmentId, cwToken, uploadUrl }
                );
                yield context.df.callActivity('cronitorPing', pingInput({
                    message: `Binary uploaded to OpenGov - AttachmentID=${attachmentId} SizeBytes=${uploadResult.sizeBytes}`
                }));

                // linking attachment to OpenGov record
                const attachedRecord = yield context.df.callActivityWithRetry(
                    'attachFile',
                    retryOptions,
                    { fileID, attachmentName, id: body.OpenGovID }
                );
                yield context.df.callActivity('cronitorPing', pingInput({
                    message: `Attachment linked to record - RecordAttachmentID=${attachedRecord.data.id} OpenGovID=${body.OpenGovID}`
                }));

            } // end for attachments
        } else {
            yield context.df.callActivity('cronitorPing', pingInput({
                message: 'No attachments found - skipping upload loop'
            }));
        } // end if attachments

        // update OpenGov record workflow step for VPA Mowing Abatement
        yield context.df.callActivity('cronitorPing', pingInput({
            message: `Updating workflow step - OpenGovID=${body.OpenGovID} Status=${body.Status}`
        }));
        const workflowResult = yield context.df.callActivityWithRetry(
            'workflowUpdate',
            retryOptions,
            { orderNumber: body.CityworksWOID, status: body.Status, id: body.OpenGovID }
        );

        const updatedStepId = workflowResult?.data?.id ?? null;
        if (updatedStepId) {
            yield context.df.callActivity('cronitorPing', pingInput({
                state: 'complete',
                message: `Completed successfully - CityworksWOID=${body.CityworksWOID} StepID=${updatedStepId}`
            }));
        } else {
            yield context.df.callActivity('cronitorPing', pingInput({
                state: 'complete',
                message: `Completed - no active VPA Mowing Abatement step found - CityworksWOID=${body.CityworksWOID} OpenGovID=${body.OpenGovID}`
            }));
        }

        return; // end of orchestration
    } catch (error) {
        // send failure ping to cronitor
        yield context.df.callActivity('cronitorPing', pingInput({
            state: 'fail',
            message: `Failed - CityworksWOID=${body.CityworksWOID} Error=${error.message}`
        }));
        throw error;
    }
});
