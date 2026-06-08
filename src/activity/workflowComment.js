const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity("workflowComment", {
  handler: async (input) => {
    const { id, stepID, comment } = input;

    try {
      const response = await axios({
        method: "POST",
        url: `https://api.plce.opengov.com/plce/v2/southbendin/records/${id}/workflow-steps/${stepID}/comments`,
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Token ${process.env.OPENGOV_TOKEN}`
        },
        data: JSON.stringify({
          data: {
            type: "workflowStepComment",
            attributes: {
              commentType: "COMMENT",
              comment: comment
            }
          }
        }),
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
});
