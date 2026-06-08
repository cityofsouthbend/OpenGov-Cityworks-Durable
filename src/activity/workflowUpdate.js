const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity("workflowUpdate", {
  handler: async (input) => {
    const { orderNumber, status, id, stepStatus = 'COMPLETE' } = input

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
      const updateAction = await axios({
        method: "PATCH",
        url: `https://api.plce.opengov.com/plce/v2/southbendin/records/${id}/workflow-steps/${activeMowingStep.id}`,
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Token ${process.env.OPENGOV_TOKEN}`
        },
        data: JSON.stringify({
          data: {
            type: "workflowStep",
            id: `CW=OG-${activeMowingStep.id}`,
            attributes: {
              label: activeMowingStep.attributes.label,
              status: stepStatus,
            }
          },
        }),
        timeout: 30000
      });

      return updateAction.data;
    }

    return null;
  } catch (error) {
      throw error;
  }
},
});