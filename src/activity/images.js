const { app } = require('@azure/functions');
const df = require('durable-functions');

df.app.activity('images', {
    handler: (input) => {
        return true
    },
});