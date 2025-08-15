import { settings } from '../handlers/readSettings.js';
import db from '../handlers/database.js';
import fetch from 'node-fetch';

const settingsData = settings();

export default function vpnCheck(ip) {
    return new Promise(async resolve => {
        let vpninfo = await db.get(`vpninfo-${ip}`);
        let vpncheck;
        if (!vpninfo) {
            try {
                vpncheck = await (await fetch(`https://proxycheck.io/v2/${ip}?key=${settingsData.AntiVPN.key}&vpn=1`)).json();
            } catch(err) {
                console.error(err);
            }
        } 
        if (vpninfo || (vpncheck && vpncheck[ip])) {
            if (!vpninfo) vpninfo = vpncheck[ip].proxy;
            await db.set(`vpninfo-${ip}`, vpninfo);
            return resolve(vpninfo === "yes");
        } else return resolve(false);
    })
}