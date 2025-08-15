import * as indexjs from '../index.js';
import * as adminjs from './admin.js';
import { settings as loadSettings } from '../handlers/readSettings.js';
import db from '../handlers/database.js';

const settings = loadSettings();

export async function load(app, ejs, olddb) {
  app.get("/buyram", async (req, res) => {
    let newsettings = await enabledCheck(req, res);
    if (newsettings) {
      let amount = req.query.amount;

      if (!amount) return res.send("missing amount");

      amount = parseFloat(amount);

      if (isNaN(amount)) return res.send("amount is not a number");

      if (amount < 1 || amount > 10) return res.send("amount must be 1-10");
      
      let theme = indexjs.get(req);
      let failedcallback = theme.settings.redirect.failedpurchaseram ? theme.settings.redirect.failedpurchaseram : "/";

      let usercoins = await db.get("coins-" + req.session.userinfo.id);
      usercoins = usercoins ? usercoins : 0;
        
      let ram = await db.get("ram-" + req.session.userinfo.id);

      if (ram + amount > settings.storelimits.ram) return res.redirect(failedcallback + "?err=MAXRAMEXCEETED");

      let per = newsettings.api.client.coins.store.ram.per * amount;
      let cost = newsettings.api.client.coins.store.ram.cost * amount;

      if (usercoins < cost) return res.redirect(failedcallback + "?err=CANNOTAFFORD");

      let newusercoins = usercoins - cost;
      let newram = ram + amount;

      if (newusercoins == 0) {
        await db.delete("coins-" + req.session.userinfo.id);
        await db.set("ram-" + req.session.userinfo.id, newram);
      } else {
        await db.set("coins-" + req.session.userinfo.id, newusercoins);
        await db.set("ram-" + req.session.userinfo.id, newram);
      }

      let extra = await db.get("extra-" + req.session.userinfo.id);
      extra = extra ? extra : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
        backups: 0,
        databases: 0,
        allocations: 0
      };

      extra.ram = extra.ram + per;

      if (extra.ram == 0 && extra.disk == 0 && extra.cpu == 0 && extra.servers == 0 && extra.backups ==0 && extra.databases ==0 && extra.allocations) {
        await db.delete("extra-" + req.session.userinfo.id);
      } else {
        await db.set("extra-" + req.session.userinfo.id, extra);
      }

      adminjs.suspend(req.session.userinfo.id);

      res.redirect((theme.settings.redirect.purchaseram ? theme.settings.redirect.purchaseram : "/") + "?err=none");
    }
  });

  app.get("/buydisk", async (req, res) => {
    let newsettings = await enabledCheck(req, res);
    if (newsettings) {
      let amount = req.query.amount;

      if (!amount) return res.send("missing amount");

      amount = parseFloat(amount);

      if (isNaN(amount)) return res.send("amount is not a number");

      if (amount < 1 || amount > 10) return res.send("amount must be 1-10");
      
      let theme = indexjs.get(req);
      let failedcallback = theme.settings.redirect.failedpurchasedisk ? theme.settings.redirect.failedpurchasedisk : "/";

      let usercoins = await db.get("coins-" + req.session.userinfo.id);
      usercoins = usercoins ? usercoins : 0;

      let disk = await db.get("disk-" + req.session.userinfo.id);

      if (disk + amount > settings.storelimits.disk) return res.redirect(failedcallback + "?err=MAXDISKEXCEETED");

      let per = newsettings.api.client.coins.store.disk.per * amount;
      let cost = newsettings.api.client.coins.store.disk.cost * amount;

      if (usercoins < cost) return res.redirect(failedcallback + "?err=CANNOTAFFORD");

      let newusercoins = usercoins - cost;
      let newdisk = disk + amount;

      if (newusercoins == 0) {
        await db.delete("coins-" + req.session.userinfo.id);
        await db.set("disk-" + req.session.userinfo.id, newdisk);
      } else {
        await db.set("coins-" + req.session.userinfo.id, newusercoins);
        await db.set("disk-" + req.session.userinfo.id, newdisk);
      }

      let extra = await db.get("extra-" + req.session.userinfo.id);
      extra = extra ? extra : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
        backups: 0,
        databases: 0,
        allocations: 0
      };

      extra.disk = extra.disk + per;

      if (extra.ram == 0 && extra.disk == 0 && extra.cpu == 0 && extra.servers == 0 && extra.backups ==0 && extra.databases ==0 && extra.allocations) {
        await db.delete("extra-" + req.session.userinfo.id);
      } else {
        await db.set("extra-" + req.session.userinfo.id, extra);
      }

      adminjs.suspend(req.session.userinfo.id);

      res.redirect((theme.settings.redirect.purchasedisk ? theme.settings.redirect.purchasedisk : "/") + "?err=none");
    }
  });

  app.get("/buycpu", async (req, res) => {
    let newsettings = await enabledCheck(req, res);
    if (newsettings) {
      let amount = req.query.amount;

      if (!amount) return res.send("missing amount");

      amount = parseFloat(amount);

      if (isNaN(amount)) return res.send("amount is not a number");

      if (amount < 1 || amount > 10) return res.send("amount must be 1-10");
      
      let theme = indexjs.get(req);
      let failedcallback = theme.settings.redirect.failedpurchasecpu ? theme.settings.redirect.failedpurchasecpu : "/";

      let usercoins = await db.get("coins-" + req.session.userinfo.id);
      usercoins = usercoins ? usercoins : 0;
        
      let cpu = await db.get("cpu-" + req.session.userinfo.id);

      if (cpu + amount > settings.storelimits.cpu) return res.redirect(failedcallback + "?err=MAXCPUEXCEETED");
        
      let per = newsettings.api.client.coins.store.cpu.per * amount;
      let cost = newsettings.api.client.coins.store.cpu.cost * amount;

      if (usercoins < cost) return res.redirect(failedcallback + "?err=CANNOTAFFORD");

      let newusercoins = usercoins - cost;
      let newcpu = cpu + amount;

      if (newusercoins == 0) {
        await db.delete("coins-" + req.session.userinfo.id);
        await db.set("cpu-" + req.session.userinfo.id, newcpu);
      } else {
        await db.set("coins-" + req.session.userinfo.id, newusercoins);
        await db.set("cpu-" + req.session.userinfo.id, newcpu);
      }

      let extra = await db.get("extra-" + req.session.userinfo.id);
      extra = extra ? extra : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
        backups: 0,
        databases: 0,
        allocations: 0
      };

      extra.cpu = extra.cpu + per;

      if (extra.ram == 0 && extra.disk == 0 && extra.cpu == 0 && extra.servers == 0 && extra.backups ==0 && extra.databases ==0 && extra.allocations) {
        await db.delete("extra-" + req.session.userinfo.id);
      } else {
        await db.set("extra-" + req.session.userinfo.id, extra);
      }

      adminjs.suspend(req.session.userinfo.id);

      res.redirect((theme.settings.redirect.purchasecpu ? theme.settings.redirect.purchasecpu : "/") + "?err=none");
    }
  });

  app.get("/buydatabases", async (req, res) => {
    let newsettings = await enabledCheck(req, res);
    if (newsettings) {
      let amount = req.query.amount;

      if (!amount) return res.send("missing amount");

      amount = parseFloat(amount);

      if (isNaN(amount)) return res.send("amount is not a number");

      if (amount < 1 || amount > 10) return res.send("amount must be 1-10");
      
      let theme = indexjs.get(req);
      let failedcallback = theme.settings.redirect.failedpurchasedatabases ? theme.settings.redirect.failedpurchasedatabases : "/";

      let usercoins = await db.get("coins-" + req.session.userinfo.id);
      usercoins = usercoins ? usercoins : 0;
        
      let databases = await db.get("databases-" + req.session.userinfo.id);        

      if (databases + amount > settings.storelimits.databases) return res.redirect(failedcallback + "?err=MAXDATABASESEXCEETED");

      let per = newsettings.api.client.coins.store.databases.per * amount;
      let cost = newsettings.api.client.coins.store.databases.cost * amount;

      if (usercoins < cost) return res.redirect(failedcallback + "?err=CANNOTAFFORD");

      let newusercoins = usercoins - cost;
      let newdatabases = databases + amount;

      if (newusercoins == 0) {
        await db.delete("coins-" + req.session.userinfo.id);
        await db.set("databases-" + req.session.userinfo.id, newdatabases);
      } else {
        await db.set("coins-" + req.session.userinfo.id, newusercoins);
        await db.set("databases-" + req.session.userinfo.id, newdatabases);
      }

      let extra = await db.get("extra-" + req.session.userinfo.id);
      extra = extra ? extra : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
        backups: 0,
        databases: 0,
        allocations: 0
      };

      extra.databases = extra.databases + per;

      if (extra.ram == 0 && extra.disk == 0 && extra.cpu == 0 && extra.servers == 0 && extra.backups ==0 && extra.databases ==0 && extra.allocations) {
        await db.delete("extra-" + req.session.userinfo.id);
      } else {
        await db.set("extra-" + req.session.userinfo.id, extra);
      }

      adminjs.suspend(req.session.userinfo.id);

      res.redirect((theme.settings.redirect.purchasedatabases ? theme.settings.redirect.purchasedatabases : "/") + "?err=none");
    }
  });

  app.get("/buyallocations", async (req, res) => {
    let newsettings = await enabledCheck(req, res);
    if (newsettings) {
      let amount = req.query.amount;

      if (!amount) return res.send("missing amount");

      amount = parseFloat(amount);

      if (isNaN(amount)) return res.send("amount is not a number");

      if (amount < 1 || amount > 10) return res.send("amount must be 1-10");
      
      let theme = indexjs.get(req);
      let failedcallback = theme.settings.redirect.failedpurchaseallocations ? theme.settings.redirect.failedpurchaseallocations : "/";

      let usercoins = await db.get("coins-" + req.session.userinfo.id);
      usercoins = usercoins ? usercoins : 0;
        
      let allocations = await db.get("allocations-" + req.session.userinfo.id);

      if (allocations + amount > settings.storelimits.allocations) return res.redirect(failedcallback + "?err=MAXALLOCATIONSEXCEETED");

      let per = newsettings.api.client.coins.store.ports.per * amount;
      let cost = newsettings.api.client.coins.store.ports.cost * amount;

      if (usercoins < cost) return res.redirect(failedcallback + "?err=CANNOTAFFORD");

      let newusercoins = usercoins - cost;
      let newallocations = allocations + amount;

      if (newusercoins == 0) {
        await db.delete("coins-" + req.session.userinfo.id);
        await db.set("allocations-" + req.session.userinfo.id, newallocations);
      } else {
        await db.set("coins-" + req.session.userinfo.id, newusercoins);
        await db.set("allocations-" + req.session.userinfo.id, newallocations);
      }

      let extra = await db.get("extra-" + req.session.userinfo.id);
      extra = extra ? extra : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
        backups: 0,
        databases: 0,
        allocations: 0
      };

      extra.allocations = extra.allocations + per;

      if (extra.ram == 0 && extra.disk == 0 && extra.cpu == 0 && extra.servers == 0 && extra.backups ==0 && extra.databases ==0 && extra.allocations) {
        await db.delete("extra-" + req.session.userinfo.id);
      } else {
        await db.set("extra-" + req.session.userinfo.id, extra);
      }

      adminjs.suspend(req.session.userinfo.id);

      res.redirect((theme.settings.redirect.purchaseallocations ? theme.settings.redirect.purchaseallocations : "/") + "?err=none");
    }
  });

  app.get("/buybackups", async (req, res) => {
    let newsettings = await enabledCheck(req, res);
    if (newsettings) {
      let amount = req.query.amount;

      if (!amount) return res.send("missing amount");

      amount = parseFloat(amount);

      if (isNaN(amount)) return res.send("amount is not a number");

      if (amount < 1 || amount > 10) return res.send("amount must be 1-10");
      
      let theme = indexjs.get(req);
      let failedcallback = theme.settings.redirect.failedpurchasebackups ? theme.settings.redirect.failedpurchasebackups : "/";

      let usercoins = await db.get("coins-" + req.session.userinfo.id);
      usercoins = usercoins ? usercoins : 0;
        
      let backups = await db.get("backups-" + req.session.userinfo.id);

      if (backups + amount > settings.storelimits.backups) return res.redirect(failedcallback + "?err=MAXBACKUPSEXCEETED");
        
      let per = newsettings.api.client.coins.store.backups.per * amount;
      let cost = newsettings.api.client.coins.store.backups.cost * amount;

      if (usercoins < cost) return res.redirect(failedcallback + "?err=CANNOTAFFORD");

      let newusercoins = usercoins - cost;
      let newbackups = backups + amount;

      if (newusercoins == 0) {
        await db.delete("coins-" + req.session.userinfo.id);
        await db.set("backups-" + req.session.userinfo.id, newbackups);
      } else {
        await db.set("coins-" + req.session.userinfo.id, newusercoins);
        await db.set("backups-" + req.session.userinfo.id, newbackups);
      }

      let extra = await db.get("extra-" + req.session.userinfo.id);
      extra = extra ? extra : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
        backups: 0,
        databases: 0,
        allocations: 0
      };

      extra.backups = extra.backups + per;

      if (extra.ram == 0 && extra.disk == 0 && extra.cpu == 0 && extra.servers == 0 && extra.backups ==0 && extra.databases ==0 && extra.allocations) {
        await db.delete("extra-" + req.session.userinfo.id);
      } else {
        await db.set("extra-" + req.session.userinfo.id, extra);
      }

      adminjs.suspend(req.session.userinfo.id);

      res.redirect((theme.settings.redirect.purchasebackups ? theme.settings.redirect.purchasebackups : "/") + "?err=none");
    }
  });

  app.get("/buyservers", async (req, res) => {
    let newsettings = await enabledCheck(req, res);
    if (newsettings) {
      let amount = req.query.amount;

      if (!amount) return res.send("missing amount");

      amount = parseFloat(amount);

      if (isNaN(amount)) return res.send("amount is not a number");

      if (amount < 1 || amount > 10) return res.send("amount must be 1-10");
      
      let theme = indexjs.get(req);
      let failedcallback = theme.settings.redirect.failedpurchaseservers ? theme.settings.redirect.failedpurchaseservers : "/";

      let usercoins = await db.get("coins-" + req.session.userinfo.id);
      usercoins = usercoins ? usercoins : 0;
        
      let servers = await db.get("servers-" + req.session.userinfo.id);

      if (servers + amount > settings.storelimits.servers) return res.redirect(failedcallback + "?err=MAXSERVERSEXCEETED");
        
      let per = newsettings.api.client.coins.store.servers.per * amount;
      let cost = newsettings.api.client.coins.store.servers.cost * amount;

      if (usercoins < cost) return res.redirect(failedcallback + "?err=CANNOTAFFORD");

      let newusercoins = usercoins - cost;
      let newservers = servers + amount;

      if (newusercoins == 0) {
        await db.delete("coins-" + req.session.userinfo.id);
        await db.set("servers-" + req.session.userinfo.id, newservers);
      } else {
        await db.set("coins-" + req.session.userinfo.id, newusercoins);
        await db.set("servers-" + req.session.userinfo.id, newservers);
      }

      let extra = await db.get("extra-" + req.session.userinfo.id);
      extra = extra ? extra : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
        backups: 0,
        databases: 0,
        allocations: 0
      };

      extra.servers = extra.servers + per;

      if (extra.ram == 0 && extra.disk == 0 && extra.cpu == 0 && extra.servers == 0 && extra.backups ==0 && extra.databases ==0 && extra.allocations) {
        await db.delete("extra-" + req.session.userinfo.id);
      } else {
        await db.set("extra-" + req.session.userinfo.id, extra);
      }

      adminjs.suspend(req.session.userinfo.id);

      res.redirect((theme.settings.redirect.purchaseservers ? theme.settings.redirect.purchaseservers : "/") + "?err=none");
    }
  });

  async function enabledCheck(req, res) {
    let newsettings = loadSettings();
    if (newsettings.api.client.coins.store.enabled == true) return newsettings;
    let theme = indexjs.get(req);
    ejs.renderFile(
      `./themes/${theme.name}/${theme.settings.notfound}`, 
      await eval(indexjs.renderdataeval),
      null,
    function (err, str) {
      delete req.session.newaccount;
      if (err) {
        console.log(`[WEBSITE] An error has occured on path ${req._parsedUrl.pathname}:`);
        console.log(err);
        return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
      };
      res.status(404);
      res.send(str);
    });
    return null;
  }
}