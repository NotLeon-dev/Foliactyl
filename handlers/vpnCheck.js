const settings = require("../handlers/readSettings").settings();
const db = require("../handlers/database");
const fetch = require('node-fetch');

module.exports = (ip) => {
    return new Promise(async resolve => {
        let vpninfo = await db.get(`vpninfo-${ip}`)
        if (!vpninfo) {
            try {
                vpncheck = await(await fetch(`https://proxycheck.io/v2/${ip}?key=${settings.AntiVPN.key}&vpn=1`)).json()
            } catch(err) {
                console.log(err)
            }
        } 
        if (vpninfo || (vpncheck && vpncheck[ip])) {
            if (!vpninfo) vpninfo = vpncheck[ip].proxy
            await db.set(`vpninfo-${ip}`, vpninfo)
            if (vpninfo === "yes") return resolve(true)
            else return resolve(false)
        } else return resolve(false)
    })
}