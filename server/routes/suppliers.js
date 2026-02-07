const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin', 'Inventory Officer'));

// GET all suppliers
router.get('/', (req, res) => {
    try {
        const { status } = req.query;
        let sql = 'SELECT * FROM suppliers';
        if (status) sql += ` WHERE status = '${status}'`;
        sql += ' ORDER BY name';
        res.json({ suppliers: query(sql) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});

// GET supplier by ID
router.get('/:id', (req, res) => {
    try {
        const supplier = queryOne('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
        res.json({ supplier });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch supplier' });
    }
});

// POST create supplier
router.post('/', (req, res) => {
    try {
        const { name, email, phone, address, city, country } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });

        run(`INSERT INTO suppliers (name, email, phone, address, city, country) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email || null, phone || null, address || null, city || null, country || null]);
        res.status(201).json({ message: 'Supplier created' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

// PUT update supplier
router.put('/:id', (req, res) => {
    try {
        const { name, email, phone, address, city, country } = req.body;
        const supp = queryOne('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        if (!supp) return res.status(404).json({ error: 'Supplier not found' });

        run(`UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ?, city = ?, country = ?, updated_at = datetime('now') WHERE id = ?`,
            [name || supp.name, email ?? supp.email, phone ?? supp.phone, address ?? supp.address, city ?? supp.city, country ?? supp.country, req.params.id]);
        res.json({ message: 'Supplier updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});

// DELETE supplier
router.delete('/:id', (req, res) => {
    try {
        run(`UPDATE suppliers SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Supplier deactivated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to deactivate supplier' });
    }
});

module.exports = router;
