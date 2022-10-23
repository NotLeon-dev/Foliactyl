const settings = require('../handlers/readSettings').settings();
const makeid = require('../handlers/makeid');
const btoa = require('../handlers/btoa')

if (settings.linkvertise.enabled == true) {
 
    const db = require("../handlers/database")
    module.exports.load = async function(app, ejs, olddb) {

    app.get("/lv/gen", async (req, res) => {

        if (!req.session.pterodactyl) return res.redirect("/login");

        let referer = req.headers.referer;

        if (!referer) return res.redirect('/lv');
        if (referer.includes('?sucess=true')) referer = referer.split('?sucess=true')[0]
        if (referer.includes('?err=abuse')) referer = referer.split('?err=abuse')[0]

        const code = makeid(8);
        const link = `https://link-to.net/${settings.linkvertise.userid}/${Math.random() * 1000}/dynamic?r=${btoa(encodeURI(`${referer}/redeem?code=${code}`))}`;

        req.session.linkvertise = {
            code: code,
            generated: Date.now()
        }

        return res.redirect(link);
    })
 
    app.get("/lv/redeem", async (req, res) => {

        if (!req.session.pterodactyl) return res.redirect("/login");

        const referer = req.headers.referer;
        const code = req.query.code

        if (!code || !req.session.linkvertise || !referer) return res.redirect('/lv')

        if (code !== req.session.linkvertise.code) return res.redirect('/lv')

        if (!referer.includes('linkvertise.com')) return res.redirect("/lv?err=abuse")

        if (((Date.now() - req.session.linkvertise.generated) / 1000) < 15) return res.redirect("/lv?err=abuse")

        let coins = await db.get(`coins-${req.session.userinfo.id}`);
        await db.set(`coins-${req.session.userinfo.id}`, coins += settings.linkvertise.coins);

        delete req.session.linkvertise;

        return res.redirect('/lv?sucess=true')
    })
}}


