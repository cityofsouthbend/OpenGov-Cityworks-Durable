const { app } = require('@azure/functions');
const df = require('durable-functions');
const axios = require('axios');

df.app.activity('token', {
    handler: async () => {
        const loginName = process.env.CITYWORKS_USER;
        const password = process.env.CITYWORKS_PASS;

        if (!loginName || !password) {
            throw new Error("Missing authentication environment variables");
        }

        const resp = await axios.get(
            "https://app05.cityworksonline.com/CLIENT_SouthBendIN/Services/General/Authentication/Authenticate?data={'LoginName':'" + loginName + "','Password':'" + password + "'}"
        );
        return `${resp.data.Value.Token}`;
    },
});