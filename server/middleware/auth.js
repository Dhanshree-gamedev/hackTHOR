const { verifyToken } = require('../utils/token');
const { queryOne } = require('../config/database');

/**
 * Authentication middleware
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token required' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = queryOne('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    if (user.status !== 'active') {
        return res.status(401).json({ error: 'User account is inactive' });
    }

    req.user = user;
    next();
}

/**
 * Optional authentication middleware
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const user = queryOne('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
                if (user && user.status === 'active') {
                    req.user = user;
                }
            }
        }
    }

    next();
}

module.exports = { authenticate, optionalAuth };
