
// middleware to ensure user is logged in , and if not redirected 
function requireLogin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    res.locals.currentUserId =  req.session.userId;
    res.locals.currentUsername = req.session.username;
    next();
}

module.exports = { requireLogin };