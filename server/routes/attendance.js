const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin', 'HR Officer'));

// GET attendance records
router.get('/', (req, res) => {
    try {
        const { start_date, end_date, employee_id } = req.query;
        let sql = `SELECT a.*, e.name as employee_name, e.department FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE 1=1`;
        const params = [];

        if (start_date) { sql += ' AND a.date >= ?'; params.push(start_date); }
        if (end_date) { sql += ' AND a.date <= ?'; params.push(end_date); }
        if (employee_id) { sql += ' AND a.employee_id = ?'; params.push(employee_id); }

        sql += ' ORDER BY a.date DESC, e.name';
        res.json({ attendance: query(sql, params) });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// POST single attendance
router.post('/', (req, res) => {
    try {
        const { employee_id, date, check_in, check_out, status, notes } = req.body;
        if (!employee_id || !date) return res.status(400).json({ error: 'Employee and date required' });

        run(`INSERT OR REPLACE INTO attendance (employee_id, date, check_in, check_out, status, notes) VALUES (?, ?, ?, ?, ?, ?)`,
            [employee_id, date, check_in || null, check_out || null, status || 'present', notes || null]);

        res.status(201).json({ message: 'Attendance recorded' });
    } catch (error) {
        console.error('Create attendance error:', error);
        res.status(500).json({ error: 'Failed to record attendance' });
    }
});

// POST bulk attendance
router.post('/bulk', (req, res) => {
    try {
        const { date, records } = req.body;
        if (!date || !records?.length) return res.status(400).json({ error: 'Date and records required' });

        for (const r of records) {
            run(`INSERT OR REPLACE INTO attendance (employee_id, date, check_in, check_out, status, notes) VALUES (?, ?, ?, ?, ?, ?)`,
                [r.employee_id, date, r.check_in || null, r.check_out || null, r.status || 'present', r.notes || null]);
        }

        res.status(201).json({ message: `${records.length} records saved` });
    } catch (error) {
        console.error('Bulk attendance error:', error);
        res.status(500).json({ error: 'Failed to save bulk attendance' });
    }
});

module.exports = router;
