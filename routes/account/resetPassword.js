const settings = require("../../handlers/readSettings").settings();
if (settings.smtp.enabled == true) {
const mailer = require("../../handlers/mailer").mailer();
const db = require("../../handlers/database");
const makeid = require("../../handlers/makeid");

module.exports.load = async function(app, ejs, olddb) {
    app.get("/accounts/email/reset", async (req, res) => {
        if (!req.query.email) return res.send("You provided no email address.")

        let user = await db.get(`user-${req.query.email}`)
        if (!user) return res.send("No account with that email exists.")

        const id = makeid(8)
        var contentHTML = `<h1>${settings.name}</h1>
      Hello ${await db.get(`username-${req.query.email}`)}!
      <br>We've recently received a request for resetting your password, if this wasn't you, you can ignore this email.<br>
      If this was you please click this <a href="${settings.api.client.oauth2.link}/reset/password/form?id=${id}">link</a><br>`;
        await mailer.sendMail({
            from: settings.smtp.mailfrom,
            to: req.query.email,
            subject: "Reset Password", 
            html: contentHTML, 
          });
        await db.set(`resetid-${id}`, req.query.email)
        return res.redirect("/reset/password?success=RESET_PASSWORD_REQUEST")
    })

    app.get("/accounts/email/password/reset/:id", async (req, res) => {
        if (!req.params.id) return res.send("Missing ID.")
        if (!req.query.password || !req.query.confirm_password) return res.send("Missing information.")
        if (req.query.password !== req.query.confirm_password) return res.redirect(`/reset/password/form?id=${req.params.id}&err=password`)
        let resetid = await db.get(`resetid-${req.params.id}`)
        if (!resetid) return res.send("Invalid reset ID.")

        let user = await db.get(`user-${resetid}`)
        user.password = req.query.password
        await db.set(`user-${resetid}`, user);
        await db.delete(`resetid-${req.params.id}`);

        return res.redirect("/?success=RESET_PASSWORD")
    })
}
}