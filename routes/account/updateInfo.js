import fetch from 'node-fetch';
import { settings } from '../../handlers/readSettings.js';
import emailCheck from '../../handlers/emailCheck.js';

const settingsData = settings();

export async function load(app, ejs, db) {
    app.get('/accounts/update/info', async (req, res) => {
        if (!req.session.pterodactyl) return res.redirect('/');
        if (!req.query.username || !req.query.email) return res.send('<br>Missing information</br>');
        if ((await db.get(`user-${req.session.userinfo.id}`)).type == 'discord' && (await db.get(`user-${req.session.userinfo.id}`)).linked == false) return res.send("You've registered with discord, and are not linked, meaning you can't change your email.")  
        if (await db.get(`user-${req.query.email}`)) return res.redirect('/accounts?err=USER_WITH_THIS_EMAIL_ALREADY_EXISTS')

        const emailVerifier = await emailCheck(req.query.email)
        if (emailVerifier == true) return res.send('You are using an invalid email.')

        let user = await db.get(`user-${req.session.userinfo.id}`);
        let coins = await db.get(`coins-${req.session.userinfo.id}`)
        let users = await db.get(`users-${req.session.userinfo.id}`)
        let extra = await db.get(`extra-${req.session.userinfo.id}`)
        let ram = await db.get(`ram-${req.session.userinfo.id}`)
        let disk = await db.get(`disk-${req.session.userinfo.id}`)
        let cpu = await db.get(`cpu-${req.session.userinfo.id}`)
        let databases = await db.get(`databases-${req.session.userinfo.id}`)
        let allocations = await db.get(`allocations-${req.session.userinfo.id}`)
        let backups = await db.get(`backups-${req.session.userinfo.id}`)
        let pkg = await db.get(`package-${req.session.userinfo.id}`)

        await fetch(
            `${settingsData.pterodactyl.domain}/api/application/users/${req.session.pterodactyl.id}`,
            {
              method: 'patch',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settingsData.pterodactyl.key}`
              },
              body: JSON.stringify({
                username: req.query.username,
                email: req.query.email,
                first_name: req.session.pterodactyl.first_name,
                last_name: req.session.pterodactyl.last_name,
                password: req.session.password
              })
            }
        );
        let cacheaccount = await fetch(
            `${settingsData.pterodactyl.domain}/api/application/users/${req.session.pterodactyl.id}?include=servers`,
            {
              method: 'get',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settingsData.pterodactyl.key}` }
            }
          );
        if (await cacheaccount.statusText == 'Not Found') return res.send('An error has occured while attempting to get your user information.');
        cacheaccount = JSON.parse(await cacheaccount.text());

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

        await db.set(`coins-${req.query.email}`, coins)
        await db.set(`users-${req.query.email}`, users)
        await db.set(`extra-${req.query.email}`, extra)
        await db.set(`ram-${req.query.email}`, ram)
        await db.set(`disk-${req.query.email}`, disk)
        await db.set(`cpu-${req.query.email}`, cpu)
        await db.set(`databases-${req.query.email}`, databases)
        await db.set(`allocations-${req.query.email}`, allocations)
        await db.set(`backups-${req.query.email}`, backups)
        await db.set(`package-${req.query.email}`, pkg)
        await db.set(`username-${req.query.email}`, req.query.username);

        let userids = await db.get('users') ? await db.get('users') : [];
        if (userids.includes(req.session.userinfo.id)) userids.splice(userids.indexOf(req.session.userinfo.id), 1);
        await userids.push(req.query.email)
        await db.set('users', userids)

        let userslist = await db.get('userlist');
        if (userslist.includes(req.session.userinfo.id)) userslist.splice(userslist.indexOf(req.session.userinfo.id), 1);
        await userslist.push(req.query.email)
        await db.set('userlist', userslist)

        user.email = req.query.email
        user.username = req.query.username;
        await db.set(`user-${req.query.email}`, user);

        req.session.pterodactyl = cacheaccount.attributes;
        req.session.userinfo = user;
        return res.redirect('/accounts?success=update_info');
    })
}
