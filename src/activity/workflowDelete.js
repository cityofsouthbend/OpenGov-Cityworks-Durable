const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity("workflowDelete", {
  handler: async (input) => {
    const { id, labels } = input;

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
      const deleted = [];
      const notFound = [];

      for (const label of labels) {
        const match = steps.find(step => step.attributes.label === label);
        if (!match) {
          notFound.push(label);
          continue;
        }

        await axios({
          method: "DELETE",
          url: `https://api.plce.opengov.com/plce/v2/southbendin/records/${id}/workflow-steps/${match.id}`,
          headers: {
            'Authorization': `Token ${process.env.OPENGOV_TOKEN}`
          },
          timeout: 30000
        });

        deleted.push({ label, stepID: match.id });
      }

      return { deleted, notFound };
    } catch (error) {
      throw error;
    }
  },
});
