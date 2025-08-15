// Load packages.
import fs from 'fs';
import chalk from 'chalk';
import figlet from 'figlet';
import yaml from 'js-yaml';
import pkgGlob from 'glob';
const { glob } = pkgGlob;
import path from 'path';
import { pathToFileURL } from 'url';
import { text as arciotext } from './routes/arcio.js';
import fetch from 'node-fetch';
import express from 'express';
import expressWs from 'express-ws';
import session from 'express-session';
import ejs from 'ejs';
import { createClient } from '@libsql/client';

// Load settings.
import { settings as loadSettings } from './handlers/readSettings.js';
const settings = loadSettings();

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
import db from './handlers/database.js';
export { db };

// Load websites.
const app = express();
expressWs(app);
export { app };

// Create Turso client for session store (only if env vars provided)
let tursoClient = null;
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  try {
    tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  } catch (e) {
    console.warn(chalk.red('[TURSO] Failed to create client: ' + e));
    tursoClient = null;
  }
} else {
  console.warn('[TURSO] TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set - falling back to MemoryStore');
}

// Create custom session store for Turso
class TursoStore extends session.Store {
  constructor() {
    super();
    this.setup();
  }

  async setup() {
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expired DATETIME NOT NULL
      )
    `);
  }

  async get(sid, callback) {
    try {
      const result = await tursoClient.execute({
        sql: 'SELECT sess FROM sessions WHERE sid = ? AND expired > datetime("now")',
        args: [sid]
      });
      callback(null, result.rows[0] ? JSON.parse(result.rows[0].sess) : null);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid, session, callback) {
    try {
      const expired = new Date(Date.now() + 86400000); // 24 hours from now
      await tursoClient.execute({
        sql: 'INSERT OR REPLACE INTO sessions (sid, sess, expired) VALUES (?, ?, ?)',
        args: [sid, JSON.stringify(session), expired.toISOString()]
      });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      await tursoClient.execute({
        sql: 'DELETE FROM sessions WHERE sid = ?',
        args: [sid]
      });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

// Load the website.
app.use(session({
  secret: settings.website.secret,
  resave: true,
  saveUninitialized: true,
  store: tursoClient ? new TursoStore() : new session.MemoryStore(),
  cookie: {
    maxAge: 86400000 // 24 hours
  }
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
  console.log(chalk.green(figlet.textSync("Foliactyl")));
  console.log(chalk.blue(`[Foliactyl] The client has successfully loaded on port ${settings.website.port}`));
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
    let theme = get(req);

    req.session.destroy(() => {
      return res.redirect(theme.settings.redirect.logout || "/");
    });

    return;
  }
  next();
});

// Helper exports used by routes (provide before loading routes)
export const renderdataeval = (
  '(async () => {\n' +
  '  let renderdata = {\n' +
  '    req: req,\n' +
  '    settings: settings,\n' +
  '    userinfo: req.session.userinfo,\n' +
  '    theme: theme.name,\n' +
  '    extra: theme.settings.variables\n' +
  '  };\n' +
  '  if (typeof arciotext !== "undefined" && settings.api && settings.api.arcio && settings.api.arcio.enabled && req.session.arcsessiontoken) {\n' +
  '    // build a template literal at runtime so ${...} is evaluated by the eval() scope\n' +
  '    renderdata.arcioafktext = `\\nlet token = "${req.session.arcsessiontoken}";\\n` +\
  `let everywhat = ${settings.api.arcio["afk page"]?.every || 5};\\n` +\
  `let gaincoins = ${settings.api.arcio["afk page"]?.coins || 0};\\n` +\
  `let arciopath = "${settings.api.arcio["afk page"]?.path || ""}";\\n` +\
  `${arciotext}\\n`;\n' +
  '  }\n' +
  '  return renderdata;\n' +
  '})()'
);

export const get = () => {
  return {
    settings: (yaml.load(fs.readFileSync(`./themes/${settings.defaulttheme}/pages.yml`).toString()) ?? defaultthemesettings),
    name: (settings.defaulttheme)
  };
};

export const islimited = () => cache <= 0 ? true : false;

export const ratelimits = (length) => cache += length;

// Provide an indexjs compatibility object to routes
const indexjs = { get, renderdataeval, islimited, ratelimits, db };

// Load Routes (try ESM import, fallback to executing CommonJS-style modules)
import { createRequire } from 'module';
import vm from 'vm';

const routeFiles = glob.sync('./routes/**/*.js');
for (const file of routeFiles) {
  const abs = path.resolve(file);

  // Read file contents early so we can detect ESM-specific syntax before attempting a CJS fallback.
  let code;
  try {
    code = fs.readFileSync(abs, 'utf8');
  } catch (err) {
    console.warn(chalk.red('[WEBSITE] Failed to read route file ' + file + ': ' + err));
    continue;
  }

  try {
    // Try ESM dynamic import first
    const mod = await import(pathToFileURL(abs).href);
    if (mod && typeof mod.load === 'function') await mod.load(app, ejs, indexjs);
    continue;
  } catch (e) {
    // If import failed and the file contains ESM syntax, it's an ESM module that couldn't be imported.
    // Log the original import error and skip the CommonJS fallback to avoid parsing ESM as CJS.
    if (/^\s*(import|export)\b/m.test(code)) {
      console.warn(chalk.red('[WEBSITE] Failed to import ESM route ' + file + ': ' + e));
      continue;
    }
    // Otherwise, fall back to executing as CommonJS in a sandbox.
  }

  try {
    const require = createRequire(pathToFileURL(abs).href);
    const module = { exports: {} };
    const dirname = path.dirname(abs);
    const script = new vm.Script(`(function(require,module,exports,__filename,__dirname){\n${code}\n})`, { filename: abs });
    const context = vm.createContext({ console, Buffer, process, setTimeout, clearTimeout, URL, globalThis });
    const fn = script.runInContext(context);
    fn(require, module, module.exports, abs, dirname);
    const exported = module.exports;
    if (exported && typeof exported.load === 'function') {
      await exported.load(app, ejs, indexjs);
      continue;
    }
    console.warn(chalk.yellow('[WEBSITE] Route loaded but did not export a `load` function: ' + file));
  } catch (err) {
    console.warn(chalk.red('[WEBSITE] Failed to load route ' + file + ': ' + err));
  }
}

app.all("*", async (req, res) => {
  if (req.session.pterodactyl) if (req.session.pterodactyl.id !== await db.get(`users-${req.session.userinfo.id}`)) return res.redirect("/");
  let theme = get(req);

  if (req.session.pterodactyl) if (!await db.get(`arciocoinlimit-${req.session.userinfo.id}`)) await db.set(`arciocointlimit-${req.session.userinfo.id}`, 0)

  // settings is already the loaded settings object
  let newsettings = settings;
  if (newsettings.api?.arcio?.enabled == true) if (theme.settings.generateafktoken.includes(req._parsedUrl.pathname)) req.session.arcsessiontoken = Math.random().toString(36).substring(2, 15);
  
  if (theme.settings.mustbeloggedin.includes(req._parsedUrl.pathname)) if (!req.session.userinfo || !req.session.pterodactyl) return res.redirect("/")
  if (theme.settings.mustbeadmin.includes(req._parsedUrl.pathname)) {
  ejs.renderFile(
  `./themes/${theme.name}/${theme.settings.notfound}`, 
  await eval(renderdataeval),
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
        await eval(renderdataeval),
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
  await eval(renderdataeval),
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

// AFK Party

let partymode = ({users: 1, status: false});
if (settings["AFK Party"]?.enabled == true) {
  setInterval( async function () { 
    try {
      const res = await fetch(`${settings.api.client.oauth2.link}/api/afkparty`);
      const afkparty = await res.json();
      partymode = afkparty;
    } catch (e) {
      console.warn(chalk.red('[WEBSITE] Failed to fetch AFK party status: ' + e));
    }
  }, 5000)
}
