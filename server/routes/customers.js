const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin', 'Sales Officer'));

// GET all customers
router.get('/', (req, res) => {
    try {
        const { status } = req.query;
        let sql = 'SELECT * FROM customers';
        const params = [];
        if (status) { sql += ' WHERE status = ?'; params.push(status); }
        sql += ' ORDER BY name';
        res.json({ customers: query(sql, params) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// GET customer by ID
router.get('/:id', (req, res) => {
    try {
        const customer = queryOne('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json({ customer });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// POST create customer
router.post('/', (req, res) => {
    try {
        const { name, email, phone, address, city, country, tax_id } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });

        run(`INSERT INTO customers (name, email, phone, address, city, country, tax_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email || null, phone || null, address || null, city || null, country || null, tax_id || null]);
        res.status(201).json({ message: 'Customer created' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// PUT update customer
router.put('/:id', (req, res) => {
    try {
        const { name, email, phone, address, city, country, tax_id } = req.body;
        const cust = queryOne('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (!cust) return res.status(404).json({ error: 'Customer not found' });

        run(`UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, city = ?, country = ?, tax_id = ?, updated_at = datetime('now') WHERE id = ?`,
            [name || cust.name, email ?? cust.email, phone ?? cust.phone, address ?? cust.address, city ?? cust.city, country ?? cust.country, tax_id ?? cust.tax_id, req.params.id]);
        res.json({ message: 'Customer updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// DELETE customer
router.delete('/:id', (req, res) => {
    try {
        run(`UPDATE customers SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Customer deactivated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to deactivate customer' });
    }
});

module.exports = router;
