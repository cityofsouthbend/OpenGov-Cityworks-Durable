// activities/cronitorPing.js
const { app } = require('@azure/functions');
const axios = require('axios');

app.activity('cronitorPing', {
    handler: async (input, context) => {
        const { params } = input;
        const monitorUrl = process.env.CRON_URL;

        await axios.get(monitorUrl, { params });
        return;
    }
});
