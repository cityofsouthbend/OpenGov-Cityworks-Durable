const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity('token', {
    handler: () => {
        const loginName = '***REMOVED***';
        const password = '***REMOVED***';
        return axios.get("https://app05.cityworksonline.com/CLIENT_SouthBendIN/Services/General/Authentication/Authenticate?data={'LoginName':'" + loginName + "','Password':'" + password + "'}").then(resp => `${resp.data.Value.Token}` ).catch(e => e)
    },
});