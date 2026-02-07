const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);

// GET all products
router.get('/', requireRole('Admin', 'Sales Officer', 'Inventory Officer'), (req, res) => {
    try {
        const { status, low_stock } = req.query;
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        if (status) { sql += ' AND status = ?'; params.push(status); }
        if (low_stock === 'true') sql += ' AND stock <= min_stock';
        sql += ' ORDER BY name';
        res.json({ products: query(sql, params) });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET product by ID
router.get('/:id', requireRole('Admin', 'Sales Officer', 'Inventory Officer'), (req, res) => {
    try {
        const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST create product
router.post('/', requireRole('Admin', 'Inventory Officer'), (req, res) => {
    try {
        const { sku, name, description, category, price, cost, stock, min_stock, unit } = req.body;
        if (!sku || !name) return res.status(400).json({ error: 'SKU and name required' });

        const existing = queryOne('SELECT id FROM products WHERE sku = ?', [sku]);
        if (existing) return res.status(400).json({ error: 'SKU already exists' });

        run(`INSERT INTO products (sku, name, description, category, price, cost, stock, min_stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sku, name, description || null, category || null, price || 0, cost || 0, stock || 0, min_stock || 0, unit || 'pcs']);

        res.status(201).json({ message: 'Product created' });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PUT update product
router.put('/:id', requireRole('Admin', 'Inventory Officer'), (req, res) => {
    try {
        const { name, description, category, price, cost, min_stock, unit } = req.body;
        const prod = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!prod) return res.status(404).json({ error: 'Product not found' });

        run(`UPDATE products SET name = ?, description = ?, category = ?, price = ?, cost = ?, min_stock = ?, unit = ?, updated_at = datetime('now') WHERE id = ?`,
            [name || prod.name, description ?? prod.description, category ?? prod.category, price ?? prod.price, cost ?? prod.cost, min_stock ?? prod.min_stock, unit || prod.unit, req.params.id]);

        res.json({ message: 'Product updated' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// PUT adjust stock
router.put('/:id/stock', requireRole('Admin', 'Inventory Officer'), (req, res) => {
    try {
        const { adjustment, reason } = req.body;
        const prod = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!prod) return res.status(404).json({ error: 'Product not found' });

        const newStock = prod.stock + (adjustment || 0);
        if (newStock < 0) return res.status(400).json({ error: 'Stock cannot be negative' });

        run(`UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?`, [newStock, req.params.id]);
        res.json({ message: 'Stock adjusted', newStock });
    } catch (error) {
        console.error('Adjust stock error:', error);
        res.status(500).json({ error: 'Failed to adjust stock' });
    }
});

// DELETE (deactivate) product
router.delete('/:id', requireRole('Admin', 'Inventory Officer'), (req, res) => {
    try {
        const prod = queryOne('SELECT id FROM products WHERE id = ?', [req.params.id]);
        if (!prod) return res.status(404).json({ error: 'Product not found' });

        run(`UPDATE products SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Product deactivated' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to deactivate product' });
    }
});

module.exports = router;
