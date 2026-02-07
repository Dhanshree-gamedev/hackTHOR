const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin', 'Inventory Officer'));

// GET all purchase orders
router.get('/orders', (req, res) => {
    try {
        const { status, supplier_id } = req.query;
        let sql = `SELECT o.*, s.name as supplier_name FROM purchase_orders o JOIN suppliers s ON o.supplier_id = s.id WHERE 1=1`;
        const params = [];
        if (status) { sql += ' AND o.status = ?'; params.push(status); }
        if (supplier_id) { sql += ' AND o.supplier_id = ?'; params.push(supplier_id); }
        sql += ' ORDER BY o.order_date DESC';
        res.json({ orders: query(sql, params) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET order by ID
router.get('/orders/:id', (req, res) => {
    try {
        const order = queryOne(`SELECT o.*, s.name as supplier_name FROM purchase_orders o JOIN suppliers s ON o.supplier_id = s.id WHERE o.id = ?`, [req.params.id]);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        const items = query(`SELECT pi.*, p.name as product_name FROM purchase_items pi JOIN products p ON pi.product_id = p.id WHERE pi.order_id = ?`, [req.params.id]);
        res.json({ order, items });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// POST create purchase order
router.post('/orders', (req, res) => {
    try {
        const { supplier_id, items, tax, notes } = req.body;
        if (!supplier_id || !items?.length) return res.status(400).json({ error: 'Supplier and items required' });

        const orderNumber = `PO-${Date.now()}`;
        let subtotal = 0;
        for (const item of items) subtotal += item.quantity * item.unit_cost;
        const total = subtotal + (tax || 0);

        run(`INSERT INTO purchase_orders (order_number, supplier_id, user_id, subtotal, tax, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [orderNumber, supplier_id, req.user.id, subtotal, tax || 0, total, notes || null]);

        const orderId = queryOne("SELECT last_insert_rowid() as id").id;

        for (const item of items) {
            const itemTotal = item.quantity * item.unit_cost;
            run(`INSERT INTO purchase_items (order_id, product_id, quantity, unit_cost, total) VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.unit_cost, itemTotal]);
        }

        res.status(201).json({ message: 'Purchase order created', orderId, orderNumber });
    } catch (error) {
        console.error('Create PO error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// PUT receive goods
router.put('/orders/:id/receive', (req, res) => {
    try {
        const order = queryOne('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status === 'received') return res.status(400).json({ error: 'Already received' });

        const items = query('SELECT * FROM purchase_items WHERE order_id = ?', [req.params.id]);

        // Add stock
        for (const item of items) {
            run(`UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?`, [item.quantity, item.product_id]);
        }

        // Update order
        run(`UPDATE purchase_orders SET status = 'received', received_date = date('now'), updated_at = datetime('now') WHERE id = ?`, [req.params.id]);

        // Record expense
        run(`INSERT INTO ledger (type, category, amount, description, reference_type, reference_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['EXPENSE', 'Purchases', order.total, `Purchase Order: ${order.order_number}`, 'purchase_order', order.id, req.user.id]);

        res.json({ message: 'Goods received, stock updated' });
    } catch (error) {
        console.error('Receive PO error:', error);
        res.status(500).json({ error: 'Failed to receive goods' });
    }
});

module.exports = router;
