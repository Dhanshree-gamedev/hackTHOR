const express = require('express');
const router = express.Router();
const { query, queryOne, run, getDb, saveDatabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin', 'Sales Officer'));

// GET all sales orders
router.get('/orders', (req, res) => {
    try {
        const { status, customer_id } = req.query;
        let sql = `SELECT o.*, c.name as customer_name FROM sales_orders o JOIN customers c ON o.customer_id = c.id WHERE 1=1`;
        const params = [];
        if (status) { sql += ' AND o.status = ?'; params.push(status); }
        if (customer_id) { sql += ' AND o.customer_id = ?'; params.push(customer_id); }
        sql += ' ORDER BY o.order_date DESC';
        res.json({ orders: query(sql, params) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET order by ID
router.get('/orders/:id', (req, res) => {
    try {
        const order = queryOne(`SELECT o.*, c.name as customer_name FROM sales_orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?`, [req.params.id]);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const items = query(`SELECT si.*, p.name as product_name FROM sales_items si JOIN products p ON si.product_id = p.id WHERE si.order_id = ?`, [req.params.id]);
        res.json({ order, items });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// POST create sales order
router.post('/orders', (req, res) => {
    try {
        const { customer_id, items, tax, discount, notes } = req.body;
        if (!customer_id || !items?.length) return res.status(400).json({ error: 'Customer and items required' });

        // Validate stock
        for (const item of items) {
            const prod = queryOne('SELECT stock FROM products WHERE id = ?', [item.product_id]);
            if (!prod || prod.stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for product ID ${item.product_id}` });
            }
        }

        const orderNumber = `SO-${Date.now()}`;
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.quantity * item.unit_price;
        }
        const total = subtotal + (tax || 0) - (discount || 0);

        run(`INSERT INTO sales_orders (order_number, customer_id, user_id, subtotal, tax, discount, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderNumber, customer_id, req.user.id, subtotal, tax || 0, discount || 0, total, notes || null]);

        const orderId = queryOne("SELECT last_insert_rowid() as id").id;

        for (const item of items) {
            const itemTotal = item.quantity * item.unit_price;
            run(`INSERT INTO sales_items (order_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.unit_price, itemTotal]);
        }

        res.status(201).json({ message: 'Order created', orderId, orderNumber });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// PUT confirm order
router.put('/orders/:id/confirm', (req, res) => {
    try {
        const order = queryOne('SELECT * FROM sales_orders WHERE id = ?', [req.params.id]);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'pending') return res.status(400).json({ error: 'Order not pending' });

        const items = query('SELECT * FROM sales_items WHERE order_id = ?', [req.params.id]);

        // Deduct stock
        for (const item of items) {
            run(`UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?`, [item.quantity, item.product_id]);
        }

        // Update order status
        run(`UPDATE sales_orders SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);

        // Generate invoice
        const invoiceNumber = `INV-${Date.now()}`;
        run(`INSERT INTO invoices (invoice_number, order_id, customer_id, amount, tax, total) VALUES (?, ?, ?, ?, ?, ?)`,
            [invoiceNumber, order.id, order.customer_id, order.subtotal, order.tax, order.total]);

        // Record income in ledger
        run(`INSERT INTO ledger (type, category, amount, description, reference_type, reference_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['INCOME', 'Sales', order.total, `Sales Order: ${order.order_number}`, 'sales_order', order.id, req.user.id]);

        res.json({ message: 'Order confirmed', invoiceNumber });
    } catch (error) {
        console.error('Confirm order error:', error);
        res.status(500).json({ error: 'Failed to confirm order' });
    }
});

// GET invoices
router.get('/invoices', (req, res) => {
    try {
        const invoices = query(`SELECT i.*, c.name as customer_name FROM invoices i JOIN customers c ON i.customer_id = c.id ORDER BY i.created_at DESC`);
        res.json({ invoices });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

module.exports = router;
