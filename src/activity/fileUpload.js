const { app } = require("@azure/functions");
const df = require("durable-functions");
const axios = require("axios");

df.app.activity("fileUpload", {
  handler: async (fileName) => {

    const fileUploadInfo = await axios({
        method: 'post',
        url: `https://api.plce.opengov.com/plce/v2/southbendin/files`,
        headers: { 
            'Content-Type': 'application/vnd.api+json',
            'Authorization': `Token ${process.env.OPENGOV_TOKEN}`
        },
        data: {
            data: { type: "file", attributes: { fileName: `${fileName}` } },
        },
    });
    return fileUploadInfo.data;
  },
});