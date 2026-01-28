const { app } = require('@azure/functions');
const df = require("durable-functions");
const axios = require("axios");
// const streamToBuffer = require("stream-to-buffer");

df.app.activity("uploadImages", {
    handler: async (input) => {
        const {
            attachmentId,
            cwToken,
            uploadUrl
        } = input;

        const baseUrlCW = "https://app05.cityworksonline.com/CLIENT_SouthBendIN/Services";

        const cwResponse = await axios({
            method: "get",
            url: `${baseUrlCW}/Ams/Attachments/DownloadWorkOrderAttachment?data={'AttachmentId':${attachmentId}}`,
            headers: {
                "Authorization": `cityworks ${cwToken}`
            },
            responseType: "arraybuffer",
            timeout: 30000
        });

        const buffer = Buffer.from(cwResponse.data);
        const contentType = cwResponse.headers["content-type"] || "application/octet-stream";


        // // 2️⃣ Buffer stream (safe for ~10MB images)
        // const buffer = await new Promise((resolve, reject) => {
        //     streamToBuffer(cwResponse.data, (err, buf) => {
        //         if (err) reject(err);
        //         else resolve(buf);
        //     });
        // });

        // 3️⃣ PUT buffer to OpenGov SAS URL
        await axios.put(uploadUrl, buffer, {
            headers: {
                "x-ms-blob-type": "BlockBlob",
                "Content-Type": contentType,
                "Content-Length": buffer.length
            },
            timeout: 30000
        });

        return {
            attachmentId,
            sizeBytes: buffer.length,
            uploadedAt: new Date().toISOString()
        };
    }
});
