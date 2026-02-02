const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity("workflowUpdate", {
  handler: async (input) => {
    const { orderNumber, status, id } = input

    try {
    const listSteps = await axios({
      method: "GET",
      url: `https://api.plce.opengov.com/plce/v2/southbendin/records/${id}/workflow-steps`,
      headers: { 
        'Authorization': `Token ${process.env.OPENGOV_TOKEN}`
      },
      timeout: 30000
    });

    const steps = listSteps.data.data;
    const activeMowingStep = steps.find(step => 
      step.attributes.label === 'VPA Mowing Abatement' &&
      step.attributes.status === 'ACTIVE');

    if (activeMowingStep) {
      return activeMowingStep.id;
    }

    return null; 
  } catch (error) {
      throw error;
  }
},
});