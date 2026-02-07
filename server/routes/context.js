const express = require('express');
const router = express.Router();
const { getContent, getContextString } = require('../services/crawler');
const { authenticate } = require('../middleware/auth');

// Rate limiting for context API
const requestCounts = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return next();
    }

    const record = requestCounts.get(ip);
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_WINDOW;
        return next();
    }

    if (record.count >= RATE_LIMIT) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    record.count++;
    next();
}

// GET /api/chatbot/context - Get website content for chatbot
router.get('/context', rateLimiter, (req, res) => {
    try {
        const format = req.query.format || 'json';

        if (format === 'string') {
            res.type('text/plain').send(getContextString());
        } else {
            res.json(getContent());
        }
    } catch (error) {
        console.error('Context API error:', error);
        res.status(500).json({ error: 'Failed to fetch context' });
    }
});

// GET /api/chatbot/context/module/:name - Get specific module content
router.get('/context/module/:name', rateLimiter, (req, res) => {
    try {
        const content = getContent();
        const moduleName = req.params.name.toLowerCase();

        if (content.modules[moduleName]) {
            res.json(content.modules[moduleName]);
        } else {
            res.status(404).json({ error: 'Module not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch module' });
    }
});

// GET /api/chatbot/context/faqs - Get FAQs
router.get('/context/faqs', rateLimiter, (req, res) => {
    try {
        const content = getContent();
        res.json(content.faqs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
});

// POST /api/chatbot/context/refresh - Force refresh (admin only)
router.post('/context/refresh', authenticate, (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { initializeContent } = require('../services/crawler');
        initializeContent();
        res.json({ message: 'Content refreshed successfully', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to refresh content' });
    }
});

module.exports = router;
