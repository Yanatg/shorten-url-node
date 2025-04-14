// backend/src/middleware/requireLogin.js

function requireLogin(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Authentication required. Please log in.' }); // 401 Unauthorized
    }
}

module.exports = requireLogin;