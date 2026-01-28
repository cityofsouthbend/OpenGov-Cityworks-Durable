const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity("attachFile", {
  handler: async (input) => {
    const { fileID, attachmentName } = input;
    
    const attachmentUpload = await axios({
      method: "POST",
      url: `https://api.plce.opengov.com/plce/v2/southbendin/records/10022/attachments`, //hard coded record ID for now
      headers: { 
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Token ${process.env.OPENGOV_TOKEN}`
    },
      data: JSON.stringify({
        data: {
          type: "recordAttachment",
          attributes: {
            fileID: fileID,
            name: attachmentName
          },
        },
      }),
    });

    return attachmentUpload.data;

  },
});