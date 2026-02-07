const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin', 'HR Officer', 'Finance Officer'));

// GET payroll records
router.get('/', (req, res) => {
    try {
        const { month, year } = req.query;
        let sql = `SELECT p.*, e.name as employee_name, e.department FROM payroll p JOIN employees e ON p.employee_id = e.id WHERE 1=1`;
        const params = [];
        if (month) { sql += ' AND p.month = ?'; params.push(parseInt(month)); }
        if (year) { sql += ' AND p.year = ?'; params.push(parseInt(year)); }
        sql += ' ORDER BY e.name';
        res.json({ payroll: query(sql, params) });
    } catch (error) {
        console.error('Get payroll error:', error);
        res.status(500).json({ error: 'Failed to fetch payroll' });
    }
});

// POST generate payroll
router.post('/generate', (req, res) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) return res.status(400).json({ error: 'Month and year required' });

        const employees = query(`SELECT * FROM employees WHERE status = 'active'`);
        let count = 0;

        for (const emp of employees) {
            const existing = queryOne('SELECT id FROM payroll WHERE employee_id = ? AND month = ? AND year = ?', [emp.id, month, year]);
            if (existing) continue;

            // Calculate based on attendance
            const daysInMonth = new Date(year, month, 0).getDate();
            const workDays = daysInMonth - 8; // Approx weekends
            const attended = query(`SELECT COUNT(*) as cnt FROM attendance WHERE employee_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ? AND status IN ('present', 'late')`,
                [emp.id, String(month).padStart(2, '0'), String(year)]);

            const presentDays = attended[0]?.cnt || workDays;
            const deductions = emp.salary * ((workDays - presentDays) / workDays);
            const netSalary = emp.salary - deductions;

            run(`INSERT INTO payroll (employee_id, month, year, basic_salary, deductions, net_salary) VALUES (?, ?, ?, ?, ?, ?)`,
                [emp.id, month, year, emp.salary, deductions, netSalary]);
            count++;
        }

        res.json({ message: `Generated payroll for ${count} employees` });
    } catch (error) {
        console.error('Generate payroll error:', error);
        res.status(500).json({ error: 'Failed to generate payroll' });
    }
});

// PUT mark as paid
router.put('/:id/pay', (req, res) => {
    try {
        const payroll = queryOne('SELECT * FROM payroll WHERE id = ?', [req.params.id]);
        if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

        run(`UPDATE payroll SET status = 'paid', paid_date = date('now') WHERE id = ?`, [req.params.id]);

        // Record expense in ledger
        const emp = queryOne('SELECT name FROM employees WHERE id = ?', [payroll.employee_id]);
        run(`INSERT INTO ledger (type, category, amount, description, reference_type, reference_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['EXPENSE', 'Salary', payroll.net_salary, `Salary: ${emp?.name}`, 'payroll', payroll.id, req.user.id]);

        res.json({ message: 'Payroll marked as paid' });
    } catch (error) {
        console.error('Pay payroll error:', error);
        res.status(500).json({ error: 'Failed to mark as paid' });
    }
});

module.exports = router;
