const settings = require('../../handlers/readSettings').settings();
const mailer = require("../../handlers/mailer").mailer();
const fetch = require("node-fetch");
const vpnCheck = require("../../handlers/vpnCheck");
const emailCheck = require("../../handlers/emailCheck");
const db = require("../../handlers/database")
const makeid = require("../../handlers/makeid");

module.exports.load = async function(app, ejs, olddb) {
    app.get("/auth/login", async (req, res) => {
      if (!req.query.email || !req.query.password) return res.send("<br>Missing information.<br>")
        const user = await db.get(`user-${req.query.email}`);
        if (!user) return res.send({error: "Invalid Email or Password."});
        if (user.password !== req.query.password) return res.send({error: "Invalid Email or Password."});
        if (user.linked == false && user.type == "discord") return res.send("Looks like you've signed up with discord and don't have a linked account, try logging in with discord instead.")
        
        if (settings.blacklist.enabled == true && settings.blacklist.users.include(req.query.email)) return res.send("You have been blacklisted from this service.")

        let ip = (settings.api.client.ip["trust x-forwarded-for"] == true ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : req.connection.remoteAddress);
      ip = (ip ? ip : "::1").replace(/::1/g, "::ffff:127.0.0.1").replace(/^.*:/, '');

      if (settings.AntiVPN.enabled == true && !settings.AntiVPN.whitelistedIPs.includes(ip)) {
        const vpn = await vpnCheck(ip);
        if (vpn == true) return res.send("Faliactyl has detected that you are using an VPN.")
      }

      if (settings.api.client.ip.block.includes(ip)) return res.send("You could not sign in, because your IP has been blocked from signing in.");

      if (settings.api.client.ip["duplicate check"] == true) {
        let allips = await db.get("ips") ? await db.get("ips") : [];
        let mainip = await db.get(`ip-${req.query.email}`);
        if (mainip) {
          if (mainip !== ip) {
            allips = allips.filter(ip2 => ip2 !== mainip);
            if (allips.includes(ip)) {
              return res.send("It has been detected that you may be using an alt account.");
            }
            allips.push(ip);
            await db.set("ips", allips);
            await db.set(`ip-${req.query.email}`, ip);
          }
        } else {
          if (allips.includes(ip)) {
            return res.send("It has been detected that you may be using an alt account.");
          }
          allips.push(ip);
          await db.set("ips", allips);
          await db.set(`ip-${req.query.email}`, ip);
        }
      }

      if (settings.whitelist.enabled == true && !settings.whitelist.users.includes(req.query.email)) return res.send("Service is under maintenance, try again later.")

        let cacheaccount = await fetch(
            `${settings.pterodactyl.domain}/api/application/users/${await db.get(`users-${req.query.email}`)}?include=servers`,
            {
              method: "get",
              headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${settings.pterodactyl.key}` }
            }
          );
        if (await cacheaccount.statusText == "Not Found") return res.send("An error has occured while attempting to get your user information.");
        cacheaccount = JSON.parse(await cacheaccount.text());
        await db.set(`lastlogin-${req.query.email}`, Date.now());

        req.session.pterodactyl = cacheaccount.attributes;
        req.session.userinfo = user;
        return res.redirect("/dashboard")
    });

    app.get("/auth/register", async (req, res) => {
      if (!req.query.email || !req.query.username || !req.query.password || !req.query.referral) return res.send("Missing information")
      if (await db.get(`user-${req.query.email}`)) return res.send("Already registered.");

      const emailVerifier = await emailCheck(req.query.email)
      if (emailVerifier == false) return res.send("You are using an invalid email.")

      if (settings.blacklist.enabled == true && settings.blacklist.users.include(req.query.email)) return res.send("You have been blacklisted from this service.")

      let ip = (settings.api.client.ip["trust x-forwarded-for"] == true ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : req.connection.remoteAddress);
      ip = (ip ? ip : "::1").replace(/::1/g, "::ffff:127.0.0.1").replace(/^.*:/, '');

      if (settings.AntiVPN.enabled == true && !settings.AntiVPN.whitelistedIPs.includes(ip)) {
        const vpn = await vpnCheck(ip);
        if (vpn == true) return res.send("Faliactyl has detected that you are using an VPN.")
      }

      if (settings.api.client.ip.block.includes(ip)) return res.send("You could not sign in, because your IP has been blocked from signing in.");

      if (settings.api.client.ip["duplicate check"] == true) {
        let allips = await db.get("ips") ? await db.get("ips") : [];
        let mainip = await db.get(`ip-${req.query.email}`);
        if (mainip) {
          if (mainip !== ip) {
            allips = allips.filter(ip2 => ip2 !== mainip);
            if (allips.includes(ip)) {
              return res.send("It has been detected that you may be using an alt account.");
            }
            allips.push(ip);
            await db.set("ips", allips);
            await db.set(`ip-${req.query.email}`, ip);
          }
        } else {
          if (allips.includes(ip)) {
            return res.send("It has been detected that you may be using an alt account.");
          }
          allips.push(ip);
          await db.set("ips", allips);
          await db.set(`ip-${req.query.email}`, ip);
        }
      }

      if (settings.whitelist.enabled == true && !settings.whitelist.users.includes(req.query.email)) return res.send("Service is under maintenance, try again later.")

      let userinfo = {
        username: req.query.username, 
        id: req.query.email,
        password: req.query.password,
        discriminator: null,
        linked: false,
        type: "email"
    }
      const referral_code = req.query.referral
      if (referral_code !== "none") {
        let referral_data = await db.get(`referral-${referral_code}`)
        if (!referral_data) return res.redirect("/register?err=INVALID_REFERRAL")

        const referrer_coins = await db.get(`coins-${referral_data.email}`)
        await db.set(`coins-${referral_data.email}`, referrer_coins + settings.referral.coins)
        await db.set(`coins-${userinfo.id}`, settings.referral.coins)

        referral_data.uses += 1;
        await db.set(`referral-${referral_code}`, referral_data)
      }
        const accountjson = await fetch(
            `${settings.pterodactyl.domain}/api/application/users`, {
              method: "post",
              headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${settings.pterodactyl.key}`
              },
              body: JSON.stringify({
                username: req.query.username,
                email: req.query.email,
                first_name: req.query.username,
                last_name: "(credentials)",
                password: req.query.password
              })
            }
        );
        if (accountjson.status == 201) {
          const accountinfo = JSON.parse(await accountjson.text());
          await db.set(`users-${req.query.email}`, accountinfo.attributes.id);
        } else {
          let accountlistjson = await fetch(
            `${settings.pterodactyl.domain}/api/application/users?include=servers&filter[email]=${encodeURIComponent(req.query.email)}`, {
              method: "get",
              headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${settings.pterodactyl.key}`
              }
            }
          );
          const accountlist = await accountlistjson.json();
          const user = accountlist.data.filter(acc => acc.attributes.email == req.query.email);
          if (user.length == 1) {
            let userid = user[0].attributes.id;
            await db.set(`users-${userinfo.id}`, userid);
          } else {
            return res.send("An error has occured when attempting to create your account.");
          };
        }
        let cacheaccount = await fetch(
          `${settings.pterodactyl.domain}/api/application/users/${await db.get(`users-${req.query.email}`)}?include=servers`,
          {
            method: "get",
            headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${settings.pterodactyl.key}` }
          }
        );
        if (await cacheaccount.statusText == "Not Found") return res.send("An error has occured while attempting to get your user information.");
        let cacheaccountinfo = JSON.parse(await cacheaccount.text());

        const userReferralCode = makeid(8)
        userinfo.referral_code = userReferralCode
        await db.set(`referral-${userReferralCode}`, {
          email: userinfo.id,
          uses: 0,
          code: userReferralCode
        })

        await db.set(`user-${req.query.email}`, userinfo);
        await db.set(`lastlogin-${userinfo.id}`, Date.now());
        await db.set(`username-${userinfo.id}`, req.query.username);

        let userdb = await db.get("userlist");
        userdb = userdb ? userdb : [];
        if (!userdb.includes(`${userinfo.id}`)) {
          userdb.push(`${userinfo.id}`);
          await db.set("userlist", userdb);
        }
        if (settings.smtp.enabled == true) {
            mailer.sendMail({
              from: settings.smtp.mailfrom,
              to: userinfo.id,
              subject: `Signup`,
              html: `Thanks for signing up at ${settings.name}!`
            });
        }  
        req.session.pterodactyl = cacheaccountinfo.attributes;
        req.session.userinfo = userinfo;
        return res.redirect("/dashboard");
    });
}