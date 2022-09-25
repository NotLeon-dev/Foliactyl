const fetch = require("node-fetch");
const settings = require("../../handlers/readSettings").settings();
const chalk = require("chalk")

module.exports.load = async function(app, ejs, db) {
    app.get("/accounts/delete", async (req, res) => {
        if (!req.session.pterodactyl) return res.redirect("/")
        
        for (var i = 0; i > req.session.pterodactyl.relationships.servers.data.length; i++) {
            const deleteserver = await fetch(
                `${settings.pterodactyl.domain}/api/application/servers/${req.session.pterodactyl.relationships.servers.data[i].attributes.id}`, {
                    method: "delete",
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": `Bearer ${settings.pterodactyl.key}`
                    }
                }
            );
            if (await deleteserver.ok !== true) return res.send(`An error has occured while attempting to delete server ${req.session.pterodactyl.relationships.servers.data[i].attributes.id}, contact an administrator`)
            if (settings.renewal.enabled == true) await db.delete(`renewal-${req.session.pterodactyl.relationships.servers.data[i].attributes.id}`);
        }

        let userids = await db.get("users") ? await db.get("users") : [];
        if (userids.includes(req.session.userinfo.id)) userids.splice(users.indexOf(req.session.userinfo.id), 1);
        await db.set("users", userids)

        let users = await db.get("userlist");
        if (users.includes(req.session.userinfo.id)) users.splice(users.indexOf(req.session.userinfo.id), 1);
        await db.set("userlist", users);
        
        await db.delete(`coins-${req.session.userinfo.id}`)
        await db.delete(`user-${req.session.userinfo.id}`)
        await db.delete(`users-${req.session.userinfo.id}`)
        await db.delete(`extra-${req.session.userinfo.id}`)
        await db.delete(`ram-${req.session.userinfo.id}`)
        await db.delete(`disk-${req.session.userinfo.id}`)
        await db.delete(`cpu-${req.session.userinfo.id}`)
        await db.delete(`databases-${req.session.userinfo.id}`)
        await db.delete(`allocations-${req.session.userinfo.id}`)
        await db.delete(`backups-${req.session.userinfo.id}`)
        await db.delete(`package-${req.session.userinfo.id}`)
        await db.delete(`username-${req.session.userinfo.id}`)

        if (settings.api.client.webhook.auditlogs.enabled == true && !(settings.api.client.webhook.auditlogs.disabled.includes("deleteaccount"))) {
            let params = JSON.stringify({
                embeds: [
                    {
                        title: "Account Deleted",
                        description: `**__User:__** ${req.session.userinfo.id}`,
                        color: hexToDecimal("#FE0023")
                    }
                ]
            })
            fetch(`${settings.api.client.webhook.webhook_url}`, {
                method: "POST",
                headers: {
                    'Content-type': 'application/json',
                },
                body: params
            }).catch(e => console.warn(chalk.red(`[WEBSITE] There was an error sending to the webhook: ${e}`)));
        }

        req.session.destroy(() => {
            return res.redirect("/")
        })
    })
}

function hexToDecimal(hex) {
    return parseInt(hex.replace("#",""), 16)
}