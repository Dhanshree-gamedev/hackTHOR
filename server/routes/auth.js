const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/database');
const { comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/token');
const { logAudit, getClientIP } = require('../middleware/audit');

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            logAudit({ action: 'LOGIN_FAILED', entityType: 'auth', newValues: { email, reason: 'User not found' }, ipAddress: getClientIP(req) });
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.status !== 'active') {
            logAudit({ userId: user.id, action: 'LOGIN_FAILED', entityType: 'auth', newValues: { reason: 'Account inactive' }, ipAddress: getClientIP(req) });
            return res.status(401).json({ error: 'Account is inactive. Please contact administrator.' });
        }

        const isValid = await comparePassword(password, user.password_hash);

        if (!isValid) {
            logAudit({ userId: user.id, action: 'LOGIN_FAILED', entityType: 'auth', newValues: { reason: 'Invalid password' }, ipAddress: getClientIP(req) });
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user);
        logAudit({ userId: user.id, action: 'LOGIN_SUCCESS', entityType: 'auth', ipAddress: getClientIP(req) });

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const { verifyToken } = require('../utils/token');
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (decoded) {
            logAudit({ userId: decoded.id, action: 'LOGOUT', entityType: 'auth', ipAddress: getClientIP(req) });
        }
    }
    res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });

    const token = authHeader.split(' ')[1];
    const { verifyToken } = require('../utils/token');
    const decoded = verifyToken(token);

    if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });

    const user = queryOne('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [decoded.id]);

    if (!user || user.status !== 'active') {
        return res.status(401).json({ error: 'User not found or inactive' });
    }

    res.json({ user });
});

module.exports = router;
