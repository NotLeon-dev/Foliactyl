"use strict";

// Load packages.

const fs = require("fs");
const chalk = require("chalk");
const figlet = require('figlet')
const yaml = require('js-yaml');
const glob = require('glob');
const arciotext = (require("./pages/arciotext"));
const fetch = require("node-fetch")

// Load settings.

const settings = require('./handlers/readSettings').settings();

const defaultthemesettings = {
  index: "index.ejs",
  notfound: "index.ejs",
  redirect: {},
  pages: {},
  mustbeloggedin: [],
  mustbeadmin: [],
  variables: {}
};

// Load database

const db = require('./handlers/database');
module.exports.db = db;

// Load websites.

const express = require("express");
const app = express();
module.exports.app = app

// Load express addons.

const ejs = require("ejs");
const session = require("express-session");
require('express-ws')(app);
const indexjs = require("./index.js");

// Sets up saving session data.

const sqlite = require("better-sqlite3");
const SqliteStore = require("better-sqlite3-session-store")(session);
const session_db = new sqlite("sessions.db");

// Load the website.

app.use(session({
  secret: settings.website.secret,
  resave: true,
  saveUninitialized: true,
  store: new SqliteStore({
    client: session_db, 
    expired: {
      clear: true,
      intervalMs: 900000
    }
  })
}));

app.use(express.json({
  inflate: true,
  limit: '500kb',
  reviver: null,
  strict: true,
  type: 'application/json',
  verify: undefined
}));

let letters = ["*", "-", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "]
let srt = ""
for (var i = 0; i < 10000; i++) {
  srt += letters[Math.floor(Math.random() * letters.length)] + " ";
}
console.log(srt)

app.listen(settings.website.port, (err) => {
  console.log(chalk.green(figlet.textSync("Faliactyl")));
  console.log(chalk.blue(`[Faliactyl] The client has successfully loaded on port ${settings.website.port}`));
  if (err) console.log(chalk.red(err));
});

var cache = 0;

setInterval(
  async function() {
    if (cache - .1 < 0) return cache = 0;
    cache = cache - .1;
  }, 100
)

app.use(async (req, res, next) => {
  if (req.session.userinfo && req.session.userinfo.id && !(await db.get(`users-${req.session.userinfo.id}`))) {
    let theme = indexjs.get(req);

    req.session.destroy(() => {
      return res.redirect(theme.settings.redirect.logout || "/");
    });

    return;
  }
  next();
});

// Load Routes.

const routes = glob.sync('./routes/**/*.js');
  for (const file of routes) {
    const routes = require(file);
    if (typeof routes.load === 'function') routes.load(app, ejs, db);
}

app.all("*", async (req, res) => {
  if (req.session.pterodactyl) if (req.session.pterodactyl.id !== await db.get(`users-${req.session.userinfo.id}`)) return res.redirect("/");
  let theme = indexjs.get(req);

  if (req.session.pterodactyl) if (!await db.get(`arciocoinlimit-${req.session.userinfo.id}`)) await db.set(`arciocointlimit-${req.session.userinfo.id}`, 0)

  let newsettings = require('./handlers/readSettings').settings();
  if (newsettings.api.arcio.enabled == true) if (theme.settings.generateafktoken.includes(req._parsedUrl.pathname)) req.session.arcsessiontoken = Math.random().toString(36).substring(2, 15);
  
  if (theme.settings.mustbeloggedin.includes(req._parsedUrl.pathname)) if (!req.session.userinfo || !req.session.pterodactyl) return res.redirect("/")
  if (theme.settings.mustbeadmin.includes(req._parsedUrl.pathname)) {
    ejs.renderFile(
      `./themes/${theme.name}/${theme.settings.notfound}`, 
      await eval(indexjs.renderdataeval),
      null,
    async function (err, str) {
      delete req.session.newaccount;
      delete req.session.password;
      if (!req.session.userinfo || !req.session.pterodactyl) {
        if (err) {
          console.log(chalk.red(`[WEBSITE] An error has occured on path ${req._parsedUrl.pathname}:`));
          console.log(err);
          return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
        };
        res.status(404);
        return res.send(str);
      };

      let cacheaccount = await fetch(
        `${settings.pterodactyl.domain}/api/application/users/${await db.get(`users-${req.session.userinfo.id}`)}?include=servers`,
        {
          method: "get",
          headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${settings.pterodactyl.key}` }
        }
      );
      if (await cacheaccount.statusText == "Not Found") {
        if (err) {
          console.log(chalk.red(`[WEBSITE] An error has occured on path ${req._parsedUrl.pathname}:`));
          console.log(err);
          return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
        };
        return res.send(str);
      };
      let cacheaccountinfo = JSON.parse(await cacheaccount.text());
    
      req.session.pterodactyl = cacheaccountinfo.attributes;
      if (cacheaccountinfo.attributes.root_admin !== true) {
        if (err) {
          console.log(chalk.red(`[WEBSITE] An error has occured on path ${req._parsedUrl.pathname}:`));
          console.log(err);
          return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
        };
        return res.send(str);
      };

      ejs.renderFile(
        `./themes/${theme.name}/${theme.settings.pages[req._parsedUrl.pathname.slice(1)] ? theme.settings.pages[req._parsedUrl.pathname.slice(1)] : theme.settings.notfound}`, 
        await eval(indexjs.renderdataeval),
        null,
      function (err, str) {
        delete req.session.newaccount;
        delete req.session.password;
        if (err) {
          console.log(`[WEBSITE] An error has occured on path ${req._parsedUrl.pathname}:`);
          console.log(err);
          return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
        };
        res.status(404);
        res.send(str);
      });
    });
    return;
  };
  ejs.renderFile(
    `./themes/${theme.name}/${theme.settings.pages[req._parsedUrl.pathname.slice(1)] ? theme.settings.pages[req._parsedUrl.pathname.slice(1)] : theme.settings.notfound}`, 
    await eval(indexjs.renderdataeval),
    null,
  function (err, str) {
    delete req.session.newaccount;
    delete req.session.password;
    if (err) {
      console.log(chalk.red(`[WEBSITE] An error has occured on path ${req._parsedUrl.pathname}:`));
      console.log(err);
      return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
    };
    res.status(404);
    res.send(str);
  });
});

let partymode = ({users: 1, status: false});
if (settings["AFK Party"].enabled == true) {
  setInterval( async function () { 
    fetch(`${settings.api.client.oauth2.link}/api/afkparty`).then(res => Promise.resolve(res.json()).then(afkparty => {
      partymode = (afkparty)
    }))
  }, 5000)
}

module.exports.renderdataeval =
  `(async () => {
    const JavaScriptObfuscator = require('javascript-obfuscator');
    let renderdata = {
      req: req,
      settings: settings,
      userinfo: req.session.userinfo,
      packagename: req.session.userinfo ? await db.get("package-" + req.session.userinfo.id) ? await db.get("package-" + req.session.userinfo.id) : settings.api.client.packages.default : null,
      extraresources: !req.session.userinfo ? null : (await db.get("extra-" + req.session.userinfo.id) ? await db.get("extra-" + req.session.userinfo.id) : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
        databases: 0,
        allocations: 0,
        backups: 0
      }),
      j4r: !req.session.userinfo ? null : (await db.get("j4r-" + req.session.userinfo.id) ? await db.get("j4r-" + req.session.userinfo.id) : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
        databases: 0,
        allocations: 0,
        backups: 0
      }),
      packages: req.session.userinfo ? settings.api.client.packages.list[await db.get("package-" + req.session.userinfo.id) ? await db.get("package-" + req.session.userinfo.id) : settings.api.client.packages.default] : null,
      coins: settings.api.client.coins.enabled == true ? (req.session.userinfo ? (await db.get("coins-" + req.session.userinfo.id) ? await db.get("coins-" + req.session.userinfo.id) : 0) : null) : null,
      pterodactyl: req.session.pterodactyl,
      theme: theme.name,
      extra: theme.settings.variables
    };
    if (typeof(partymode) != "undefined") renderdata.partymode = partymode;
    if (typeof(arciotext) != "undefined") if (settings.api.arcio.enabled == true && req.session.arcsessiontoken) {
      renderdata.arcioafktext = JavaScriptObfuscator.obfuscate(\`
        let token = "\${req.session.arcsessiontoken}";
        let everywhat = \${settings.api.arcio["afk page"].every};
        let gaincoins = \${settings.api.arcio["afk page"].coins};
        let arciopath = "\${settings.api.arcio["afk page"].path.replace(/\\\\/g, "\\\\\\\\").replace(/"/g, "\\\\\\"")}";
        \${arciotext}
      \`);
    };
    return renderdata;
  })();`;
  
module.exports.get = () => {
  return {
    settings: (yaml.load(fs.readFileSync(`./themes/${settings.defaulttheme}/pages.yml`).toString()) ?? defaultthemesettings),
    name: (settings.defaulttheme)
  };
};

module.exports.islimited = () => cache <= 0 ? true : false

module.exports.ratelimits = (length) => cache += length;
