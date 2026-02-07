const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin', 'HR Officer', 'Project Manager'));

// GET all employees
router.get('/', (req, res) => {
    try {
        const { status } = req.query;
        let sql = 'SELECT * FROM employees';
        let params = [];
        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        sql += ' ORDER BY name';
        res.json({ employees: query(sql, params) });
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// GET employee by ID
router.get('/:id', (req, res) => {
    try {
        const employee = queryOne('SELECT * FROM employees WHERE id = ?', [req.params.id]);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json({ employee });
    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// POST create employee
router.post('/', (req, res) => {
    try {
        const { employee_code, name, email, phone, department, designation, salary, hire_date } = req.body;

        if (!employee_code || !name || !email || !department) {
            return res.status(400).json({ error: 'Employee code, name, email, and department are required' });
        }

        const existing = queryOne('SELECT id FROM employees WHERE employee_code = ?', [employee_code]);
        if (existing) return res.status(400).json({ error: 'Employee code already exists' });

        run(`INSERT INTO employees (employee_code, name, email, phone, department, designation, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [employee_code, name, email, phone || null, department, designation || null, salary || 0, hire_date || null]);

        res.status(201).json({ message: 'Employee created' });
    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

// PUT update employee
router.put('/:id', (req, res) => {
    try {
        const { name, email, phone, department, designation, salary, hire_date } = req.body;
        const emp = queryOne('SELECT * FROM employees WHERE id = ?', [req.params.id]);
        if (!emp) return res.status(404).json({ error: 'Employee not found' });

        run(`UPDATE employees SET name = ?, email = ?, phone = ?, department = ?, designation = ?, salary = ?, hire_date = ?, updated_at = datetime('now') WHERE id = ?`,
            [name || emp.name, email || emp.email, phone || emp.phone, department || emp.department, designation || emp.designation, salary ?? emp.salary, hire_date || emp.hire_date, req.params.id]);

        res.json({ message: 'Employee updated' });
    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// DELETE (terminate) employee
router.delete('/:id', (req, res) => {
    try {
        const emp = queryOne('SELECT id FROM employees WHERE id = ?', [req.params.id]);
        if (!emp) return res.status(404).json({ error: 'Employee not found' });

        run(`UPDATE employees SET status = 'terminated', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Employee terminated' });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({ error: 'Failed to terminate employee' });
    }
});

module.exports = router;
