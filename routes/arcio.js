import { settings } from '../handlers/readSettings.js';
import chalk from 'chalk';
import { CronJob } from 'cron';
import db from '../handlers/database.js';

const settingsData = settings();

// In-memory state
let partyon = false;
let multiplier = 1;
const currentlyonpage = { users: 0 };

function hexToDecimal(hex) {
    return parseInt(String(hex).replace('#', ''), 16);
}

async function sendPartyWebhook(title, description) {
    const hook = settingsData['AFK Party']?.webhook;
    if (!hook) return;
    const body = JSON.stringify({ embeds: [{ title, description, color: hexToDecimal('#ffff00') }] });
    try {
        await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    } catch (e) {
        console.warn(chalk.red('[WEBSITE] There was an error sending to the webhook: ' + e));
    }
}

export const text = `
function createFrame(){
    const frame = document.createElement('iframe');
    Object.assign(frame.style, {position:'fixed',top:0,left:0,right:0,bottom:0,width:'100%',height:'100%',border:'none',margin:0,padding:0});
    frame.src = arciopath + '?token=' + token;
    document.body.appendChild(frame);
}
function removeFrame(){ const f = document.querySelector('iframe'); if(f) f.remove(); }
let coins = 0; let success = true;
async function check(){
    if(!success) return;
    success = false;
    try{
        const res = await fetch('/api/arcio/redeem?token=' + token);
        const json = await res.json();
        if(!json.error){
            success = true;
            coins += gaincoins;
            const el = document.getElementById('coins');
            if(el) el.innerHTML = 'You have earned ' + coins + ' coins!';
        } else {
            success = true;
        }
    } catch(e){
        console.error('Error checking rewards:', e);
        success = true;
    }
}
document.addEventListener('DOMContentLoaded', ()=>{ createFrame(); check(); setInterval(check, (typeof everywhat === 'number' ? everywhat : 5) * 1000); });
`;

export async function load(app, ejs, indexjs = null) {
    if (!settingsData?.api?.arcio?.enabled) return;

    // AFK Party handling
    if (settingsData['AFK Party']?.enabled) {
        setInterval(() => {
            try {
                const needed = settingsData['AFK Party'].users || 0;
                if (currentlyonpage.users >= needed && !partyon) {
                    sendPartyWebhook('Party Mode', `PARTY MODE HAS ENABLED!\nAFK on the AFK Page to get ${settingsData['AFK Party'].multiplier}x earning bonus.\n`);
                    multiplier = settingsData['AFK Party'].multiplier || 1;
                    partyon = true;
                }
                if (currentlyonpage.users < needed && partyon) {
                    sendPartyWebhook('Party Mode', `PARTY MODE HAS DISABLED!\nYou will no longer get a ${settingsData['AFK Party'].multiplier}x earning bonus.\n`);
                    multiplier = 1;
                    partyon = false;
                }
            } catch (e) {
                console.warn(chalk.red('[WEBSITE] Error in AFK Party interval: ' + e));
            }
        }, 5000);

        app.get('/api/afkparty', (req, res) => res.send({ status: partyon, users: currentlyonpage.users }));
    }

    // Daily reset cron
    try {
        const afkCfg = settingsData.api?.arcio?.['afk page'];
        if (afkCfg?.coinlimit && afkCfg.coinlimit !== 0) {
            new CronJob('0 12 * * *', async () => {
                const users = await db.get('userlist') ?? [];
                for (const u of users) await db.set(`arciocoinlimit-${u}`, 0);
            }, null, true, 'America/New_York');
        }
    } catch (e) {
        console.warn(chalk.red('[WEBSITE] Error setting up CronJob for arcio: ' + e));
    }

    // Service worker route
    app.get('/arc-sw.js', (req, res) => {
        res.type('application/javascript');
        if (settingsData.api?.arcio?.enabled) {
            return res.send('// arc-sw stub - replace with full bundle if desired\n');
        }
        return res.send('');
    });

    // Generic websocket
    app.ws('/afkwebsocket', (ws, req) => {
        if (!req.session?.arcsessiontoken) { ws.close(); return; }

        if (req.session.userinfo) currentlyonpage[req.session.userinfo.id] = true;
        currentlyonpage.users += 1;

        const intervalMs = (settingsData.api?.arcio?.['afk page']?.every || 5) * 1000;
        const coinloop = setInterval(async () => {
            try {
                if (!req.session?.arcsessiontoken || !req.session?.userinfo) { clearInterval(coinloop); ws.close(); return; }

                const cfg = settingsData.api?.arcio?.['afk page'];
                if (cfg?.coinlimit && cfg.coinlimit !== 0) {
                    const coinlimit = await db.get(`arciocoinlimit-${req.session.userinfo.id}`) ?? 0;
                    if (coinlimit >= cfg.coinlimit) { ws.close(); return; }
                    await db.set(`arciocoinlimit-${req.session.userinfo.id}`, coinlimit + (cfg.coins * multiplier));
                }

                let usercoins = await db.get(`coins-${req.session.userinfo.id}`) ?? 0;
                usercoins += (settingsData.api.arcio['afk page'].coins * multiplier);
                await db.set(`coins-${req.session.userinfo.id}`, usercoins);
            } catch (e) {
                console.warn(chalk.red('[WEBSITE] AFK websocket error: ' + e));
            }
        }, intervalMs);

        ws.onclose = () => {
            clearInterval(coinloop);
            currentlyonpage.users -= 1;
            if (req.session?.userinfo) delete currentlyonpage[req.session.userinfo.id];
        };
    });

    // AFK page websocket (configurable)
    try {
        const afkPath = settingsData.api?.arcio?.['afk page']?.path;
        if (afkPath) {
            app.ws(`/${afkPath}`, async (ws, req) => {
                if (!req.session?.arcsessiontoken) return ws.close();
                const token = req.headers['sec-websocket-protocol'];
                if (!token || typeof token !== 'string' || token !== req.session.arcsessiontoken) return ws.close();

                const cfg = settingsData.api?.arcio?.['afk page'];
                if (!settingsData.api?.arcio?.enabled || !cfg?.enabled) return ws.close();
                if (currentlyonpage[req.session.userinfo.id]) return ws.close();

                if (cfg.coinlimit !== 0) {
                    const coinlimit = await db.get(`arciocoinlimit-${req.session.userinfo.id}`) ?? 0;
                    if (coinlimit >= cfg.coinlimit) return ws.close();
                }

                currentlyonpage[req.session.userinfo.id] = true;
                currentlyonpage.users += 1;

                const loop = setInterval(async () => {
                    try {
                        if (cfg.coinlimit !== 0) {
                            const coinlimit = await db.get(`arciocoinlimit-${req.session.userinfo.id}`) ?? 0;
                            if (coinlimit >= cfg.coinlimit) return ws.close();
                            await db.set(`arciocoinlimit-${req.session.userinfo.id}`, coinlimit + (cfg.coins * multiplier));
                        }
                        let usercoins = await db.get(`coins-${req.session.userinfo.id}`) ?? 0;
                        usercoins += (cfg.coins * multiplier);
                        await db.set(`coins-${req.session.userinfo.id}`, usercoins);
                    } catch (e) {
                        console.warn(chalk.red('[WEBSITE] AFK page coinloop error: ' + e));
                    }
                }, (cfg.every || 5) * 1000);

                ws.onclose = () => { clearInterval(loop); currentlyonpage.users -= 1; delete currentlyonpage[req.session.userinfo.id]; };
            });
        }
    } catch (e) {
        console.warn(chalk.red('[WEBSITE] Error registering AFK page websocket: ' + e));
    }
}