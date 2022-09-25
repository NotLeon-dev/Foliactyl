const settings = require("./readSettings").settings();
const fetch = require('node-fetch');

module.exports = () => {
    const allServers = fetch(
        `${settings.pterodactyl.domain}/api/application/servers?per_page=99999999`, {
            headers: {
                "Authorization": `Bearer ${settings.pterodactyl.key}`
            }
        }
    )
    return JSON.parse(allServers);
}

