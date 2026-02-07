const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin', 'Finance Officer'));

// GET ledger entries
router.get('/', (req, res) => {
    try {
        const { type, category, limit } = req.query;
        let sql = `SELECT l.*, u.name as user_name FROM ledger l LEFT JOIN users u ON l.user_id = u.id WHERE 1=1`;
        const params = [];
        if (type) { sql += ' AND l.type = ?'; params.push(type); }
        if (category) { sql += ' AND l.category = ?'; params.push(category); }
        sql += ' ORDER BY l.transaction_date DESC, l.id DESC';
        if (limit) sql += ` LIMIT ${parseInt(limit)}`;
        res.json({ entries: query(sql, params) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ledger' });
    }
});

// GET summary
router.get('/summary', (req, res) => {
    try {
        const income = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM ledger WHERE type = 'INCOME'");
        const expense = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM ledger WHERE type = 'EXPENSE'");
        res.json({
            summary: {
                income: income?.total || 0,
                expense: expense?.total || 0,
                balance: (income?.total || 0) - (expense?.total || 0)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get summary' });
    }
});

// POST create manual entry
router.post('/', (req, res) => {
    try {
        const { type, category, amount, description, transaction_date } = req.body;
        if (!type || !category || !amount) return res.status(400).json({ error: 'Type, category, amount required' });

        run(`INSERT INTO ledger (type, category, amount, description, transaction_date, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [type, category, amount, description || null, transaction_date || null, req.user.id]);
        res.status(201).json({ message: 'Entry created' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

// GET monthly report
router.get('/report/:year/:month', (req, res) => {
    try {
        const { year, month } = req.params;
        const entries = query(`SELECT * FROM ledger WHERE strftime('%Y', transaction_date) = ? AND strftime('%m', transaction_date) = ?`,
            [year, month.padStart(2, '0')]);

        let income = 0, expense = 0;
        for (const e of entries) {
            if (e.type === 'INCOME') income += e.amount;
            else expense += e.amount;
        }

        res.json({
            period: `${year}-${month}`,
            income, expense,
            profit: income - expense,
            entries
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;
