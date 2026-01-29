const { app } = require('@azure/functions');
const df = require('durable-functions');

app.http('Cityworks-OpenGov-OrchestratorHttpStart', {
    route: 'orchestrators/{orchestratorName}',
    extraInputs: [df.input.durableClient()],
    handler: async (request, context) => {
        const client = df.getClient(context);
        try {
            const body = await request.json();
            const instanceId = await client.startNew('Cityworks-OpenGov-OrchestratorOrchestrator', { input: body });
            context.log(`Started orchestration with ID = '${instanceId}'.`);
            return client.createCheckStatusResponse(request, instanceId);
        } catch (err) {
            context.log('Error starting orchestration:', err);
            throw err;
         }

    },
});