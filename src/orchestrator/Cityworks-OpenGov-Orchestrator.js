const { app } = require('@azure/functions');
const df = require('durable-functions');

const activityName = 'Cityworks-OpenGov-Orchestrator';

df.app.orchestration('Cityworks-OpenGov-OrchestratorOrchestrator', function* (context) {
    const body = context.df.getInput() || {};
    const outputs = [];
    
    const cwToken = yield context.df.callActivity(getCWToken);
    outputs.push(yield context.df.callActivity(activityName, 'Tokyo'));
    outputs.push(yield context.df.callActivity(activityName, 'Seattle'));
    outputs.push(yield context.df.callActivity(activityName, 'Cairo'));

    return outputs;
});



