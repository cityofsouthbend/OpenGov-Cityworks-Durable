const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity('images', {
    handler: async (input, context) => {
        const {cityworksToken, orderNumber} = input;
        const baseUrlCW = "https://app05.cityworksonline.com/CLIENT_SouthBendIN/Services";

        try {
            const AtthResponse = await axios({
                method: 'get',
                url: `${baseUrlCW}/Ams/Attachments/WorkOrderAttachments?data={'WorkOrderIds':['${orderNumber}'],'WorkOrderSids':['${orderNumber}']}`,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `cityworks ${cityworksToken}`
                },
            });

            const attachments = AtthResponse.data;

            if (attachments.Value !== null) {
                let listAtths = attachments.Value;

                function checkAtth(e) {
                    let fileName = e.Attachment.split("\\").slice(-1).toString();
                    return !fileName.startsWith("Accela_") && !fileName.startsWith("OpenGov");
                }

                let filteredAtth = listAtths.filter(checkAtth);
                return filteredAtth

            } else {
                // context.log.warn('No attachments found');
                return []; // returning an empty array for now 
            }
        } catch (error) {
            const status = error.response?.status;

            context.log('Cityworks images activity failed', {
                orderNumber,
                status,
                message: error.message
            });

            throw error;
        }
    },
});