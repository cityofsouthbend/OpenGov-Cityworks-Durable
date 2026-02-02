// activities/cronitorPing.js
const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity('cronitorPing', {
    handler: async (input, context) => {
        if (!input.enabled) {
            return;
        }

        await axios.get(process.env.CRON_URL, {
            params: input.params
        });
    }
});
