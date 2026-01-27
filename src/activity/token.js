const { app } = require('@azure/functions');
const df = require('durable-functions');

df.app.activity(activityName, {
    handler: (input) => {
        return `Hello, ${input}`;
    },
});