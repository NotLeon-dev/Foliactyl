import fetch from 'node-fetch';
import { settings as loadSettings } from '../../handlers/readSettings.js';
import chalk from 'chalk';

const settings = loadSettings();

export async function load(app, ejs, db) {
    app.get('/accounts/delete', async (req, res) => {
        if (!req.session.pterodactyl) return res.redirect('/');

        const servers = req.session.pterodactyl?.relationships?.servers?.data || [];
        for (let i = 0; i < servers.length; i++) {
            const sid = servers[i].attributes.id;
            const deleteserver = await fetch(`${settings.pterodactyl.domain}/api/application/servers/${sid}`, {
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${settings.pterodactyl.key}`
                }
            });
            if (!deleteserver.ok) return res.send(`An error has occured while attempting to delete server ${sid}, contact an administrator`);
            if (settings.renewal?.enabled === true) await db.delete(`renewal-${sid}`);
        }

        let userids = (await db.get('users')) || [];
        const userIndex = userids.indexOf(req.session.userinfo.id);
        if (userIndex !== -1) userids.splice(userIndex, 1);
        await db.set('users', userids);

        let users = (await db.get('userlist')) || [];
        const ulIndex = users.indexOf(req.session.userinfo.id);
        if (ulIndex !== -1) users.splice(ulIndex, 1);
        await db.set('userlist', users);

        const toDelete = [
            `coins-${req.session.userinfo.id}`,
            `user-${req.session.userinfo.id}`,
            `users-${req.session.userinfo.id}`,
            `extra-${req.session.userinfo.id}`,
            `ram-${req.session.userinfo.id}`,
            `disk-${req.session.userinfo.id}`,
            `cpu-${req.session.userinfo.id}`,
            `databases-${req.session.userinfo.id}`,
            `allocations-${req.session.userinfo.id}`,
            `backups-${req.session.userinfo.id}`,
            `package-${req.session.userinfo.id}`,
            `username-${req.session.userinfo.id}`
        ];
        for (const k of toDelete) await db.delete(k);

        if (settings.api?.client?.webhook?.auditlogs?.enabled === true && !(settings.api.client.webhook.auditlogs.disabled || []).includes('deleteaccount')) {
            const params = JSON.stringify({
                embeds: [
                    {
                        title: 'Account Deleted',
                        description: `**__User:__** ${req.session.userinfo.id}`,
                        color: hexToDecimal('#FE0023')
                    }
                ]
            });
            fetch(`${settings.api.client.webhook.webhook_url}`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: params
            }).catch(e => console.warn(chalk.red(`[WEBSITE] There was an error sending to the webhook: ${e}`)));
        }

        req.session.destroy(() => res.redirect('/'));
    });
}

function hexToDecimal(hex) {
    return parseInt(hex.replace('#', ''), 16);
}