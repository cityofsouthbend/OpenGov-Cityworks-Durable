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

    return listSteps.data;
  } catch (error) {
    throw error;
  }
},
});