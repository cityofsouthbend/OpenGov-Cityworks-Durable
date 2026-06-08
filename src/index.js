const { app } = require('@azure/functions');

app.setup({
    enableHttpStream: true,
});

// http starter
require('./starter/starter');

// orchestrators
require('./orchestrator/Cityworks-OpenGov-Orchestrator');

// activities
require('./activity/token');
require('./activity/images');
require('./activity/fileUpload');
require('./activity/uploadImages');
require('./activity/attachFile');
require('./activity/workflowUpdate');
require('./activity/workflowComment');
require('./activity/cronitorPing');
