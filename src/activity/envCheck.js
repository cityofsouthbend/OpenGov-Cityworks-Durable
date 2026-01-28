const { app } = require("@azure/functions");
const df = require("durable-functions");

df.app.activity('envCheck', {
    handler: () => {
        return {
            CITYWORKS_USER: process.env.CITYWORKS_USER ?? null,
            CITYWORKS_PASS: process.env.CITYWORKS_PASS ?? null
        };
    }
});
