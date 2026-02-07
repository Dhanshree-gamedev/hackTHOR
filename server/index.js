require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database initialization
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database (async for sql.js)
        await initializeDatabase();

        // Import routes after db is initialized
        const authRoutes = require('./routes/auth');
        const userRoutes = require('./routes/users');
        const employeeRoutes = require('./routes/employees');
        const attendanceRoutes = require('./routes/attendance');
        const payrollRoutes = require('./routes/payroll');
        const productRoutes = require('./routes/products');
        const customerRoutes = require('./routes/customers');
        const salesRoutes = require('./routes/sales');
        const supplierRoutes = require('./routes/suppliers');
        const purchaseRoutes = require('./routes/purchases');
        const ledgerRoutes = require('./routes/ledger');
        const projectRoutes = require('./routes/projects');
        const chatRoutes = require('./routes/chat');
        const contextRoutes = require('./routes/context');

        // Initialize website crawler
        const { initializeContent, scheduleRefresh } = require('./services/crawler');
        initializeContent();
        scheduleRefresh();

        // API Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/employees', employeeRoutes);
        app.use('/api/attendance', attendanceRoutes);
        app.use('/api/payroll', payrollRoutes);
        app.use('/api/products', productRoutes);
        app.use('/api/customers', customerRoutes);
        app.use('/api/sales', salesRoutes);
        app.use('/api/suppliers', supplierRoutes);
        app.use('/api/purchases', purchaseRoutes);
        app.use('/api/ledger', ledgerRoutes);
        app.use('/api/projects', projectRoutes);
        app.use('/api/chat', chatRoutes);
        app.use('/api/chatbot', contextRoutes);

        // Health check endpoint
        app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // Serve index.html for root and unknown routes (SPA support)
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
        });

        // Global error handler
        app.use((err, req, res, next) => {
            console.error('Error:', err.message);
            res.status(err.status || 500).json({
                error: err.message || 'Internal Server Error'
            });
        });

        app.listen(PORT, () => {
            console.log(`SimpleERP server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
