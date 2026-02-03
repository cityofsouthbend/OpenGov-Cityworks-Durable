// currently looks like this in CItyworks {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","AccelaCaseID":"{{Text1}}","AccelaInspectionID":"{{Text2}}"}
// will now look like this {"Status":"{{Text10}}","CityworksWOID":"{{WorkOrderID}}","OpenGovID":"{{Text1}}","RecordName":"{{Text2}}"}
// current POST API opengov-cityworks-apgbc2gth3cyftda.centralus-01.azurewebsites.net/api/orchestrators/Cityworks-OpenGov-OrchestratorOrchestrator
// previous codemowing-ver3.azurewebsites.net/cw

const { app } = require('@azure/functions');
const df = require('durable-functions');

df.app.orchestration('Cityworks-OpenGov-OrchestratorOrchestrator', function* (context) {

    const body = context.df.getInput() || {};

    try {
        // start cronitor
        yield context.df.callActivity('cronitorPing', {
            enabled: !context.df.isReplaying,
            params: {
                state: 'run',
                series: context.df.instanceId,
                message: `Started | CityworksWOID=${body.CityworksWOID}`
            }
        });

        // get Cityworks token
        const cwToken = yield context.df.callActivity('token');
        yield context.df.callActivity('cronitorPing', {
            enabled: !context.df.isReplaying,
            params: {
                series: context.df.instanceId,
                message: 'Cityworks token retrieved'
            }
        });
    
        // get attachments from Cityworks work order
        const attachments = yield context.df.callActivity('images', { cityworksToken: cwToken, orderNumber: body.CityworksWOID });  
        yield context.df.callActivity('cronitorPing', {
            enabled: !context.df.isReplaying,
            params: {
                series: context.df.instanceId,
                message: `Attachments found: ${attachments.length}`
            }
        });
    
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
                yield context.df.callActivity('cronitorPing', {
                    enabled: !context.df.isReplaying,
                    params: {
                        series: context.df.instanceId,
                        message: `Attachment ID ${attachedRecord.data.id} added to record`
                    }
                });
                
            } // end for attachments
        } else {
            yield context.df.callActivity('cronitorPing', {
                enabled: !context.df.isReplaying,
                params: {
                    series: context.df.instanceId,
                    message: `No attachments found`
                }
            });
        } // end if attachments

        // update OpenGov record workflow step for VPA Mowing Abatement 
        const stepID = yield context.df.callActivity('workflowUpdate', { orderNumber: body.CityworksWOID, status: body.Status, id: body.OpenGovID });
        yield context.df.callActivity('cronitorPing', {
            enabled: !context.df.isReplaying,
            params: {
                state: 'complete',
                series: context.df.instanceId,
                message: `Completed successfully | StepID: ${stepID.id}`
                }
        });

        return; // end of orchestration
    } catch (error) {
        // send failure ping to cronitor
        yield context.df.callActivity('cronitorPing', {
            enabled: !context.df.isReplaying,
            params: {
                state: 'fail',
                series: context.df.instanceId,
                message: `Failed | Error: ${error.message}`
            }
        });
        throw error;
    }
});



