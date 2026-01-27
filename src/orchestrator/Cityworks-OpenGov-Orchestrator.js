const { app } = require('@azure/functions');
const df = require('durable-functions');

const activityName = 'Cityworks-OpenGov-Orchestrator';

df.app.orchestration('Cityworks-OpenGov-OrchestratorOrchestrator', function* (context) {
    const body = context.df.getInput() || {};
    
    const cwToken = yield context.df.callActivity(getCWToken);

    return true;
});



