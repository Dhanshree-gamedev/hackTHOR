const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { hashPassword } = require('../utils/hash');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin'));

// GET all users
router.get('/', (req, res) => {
    try {
        const users = query('SELECT id, name, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC');
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET user by ID
router.get('/:id', (req, res) => {
    try {
        const user = queryOne('SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?', [req.params.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// POST create user
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required' });
        }

        const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const passwordHash = await hashPassword(password);
        run(`INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
            [name, email, passwordHash, role, status || 'active']);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT update user
router.put('/:id', async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;
        const user = queryOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (email && email !== user.email) {
            const existing = queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.params.id]);
            if (existing) return res.status(400).json({ error: 'Email already exists' });
        }

        let sql = `UPDATE users SET name = ?, email = ?, role = ?, status = ?, updated_at = datetime('now') WHERE id = ?`;
        let params = [name || user.name, email || user.email, role || user.role, status || user.status, req.params.id];

        if (password) {
            const passwordHash = await hashPassword(password);
            sql = `UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, status = ?, updated_at = datetime('now') WHERE id = ?`;
            params = [name || user.name, email || user.email, passwordHash, role || user.role, status || user.status, req.params.id];
        }

        run(sql, params);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE (deactivate) user
router.delete('/:id', (req, res) => {
    try {
        const user = queryOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        run(`UPDATE users SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);
        res.json({ message: 'User deactivated' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});

module.exports = router;
