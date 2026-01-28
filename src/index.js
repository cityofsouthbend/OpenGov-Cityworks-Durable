const { app } = require('@azure/functions');

app.setup({
    enableHttpStream: true,
});

// http starter
require('./starter/starter');

// orchestrators
require('./orchestrator/Cityworks-OpenGov-Orchestrator');

// activities
require('./activity/envCheck');
require('./activity/token');
require('./activity/images');
require('./activity/fileUpload');
