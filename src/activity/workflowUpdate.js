const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity("workflowUpdate", {
  handler: async (input) => {
    const { orderNumber, status, id } = input

    const listSteps = await axios({
      method: "GET",
      url: `https://api.plce.opengov.com/plce/v2/southbendin/records/${id}/workflow-steps`,
      headers: { 
        'Authorization': `Token ${process.env.OPENGOV_TOKEN}`
    },
    });

    return listSteps.data;

  },
});