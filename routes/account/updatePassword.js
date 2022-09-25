module.exports.load = async function(app, ejs, db) {
    app.get("/accounts/update/password", async (req, res) => {
        if (!req.session.pterodactyl) return res.redirect("/");
        if (!req.query.old-password || !req.query.new-password || !req.query.confirm-password) return res.redirect("/accounts?err=MISSINGINFO")
        if (req.query.new-password !== req.query.confirm-password) return res.redirect("/accounts?err=New-Password-Does-Not-Match-Confirm-Password")
        let user = await db.get(`user-${req.session.userinfo.id}`);
        if (req.query.new-password !== user.password) return res.redirect("/accounts?err=INVALID_PASSWORD")
        user.password = req.query.new-password
        await db.set(`user-${req.session.userinfo.id}`, user);
        return res.redirect("/accounts?sucess=update_password")
    })
}