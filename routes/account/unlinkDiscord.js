export async function load(app, ejs, db) {
    app.get('/accounts/unlink_discord', async (req, res) => {
        return res.send('This feature has not been completed yet.')
    })
}