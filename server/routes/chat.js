const express = require('express');
const router = express.Router();
const https = require('https');
const { authenticate } = require('../middleware/auth');

// OpenRouter configuration
const OPENROUTER_API_KEY = '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';
const MODEL = 'stepfun/step-3.5-flash:free';

router.use(authenticate);

// POST /api/chat - Send message to AI
router.post('/', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build messages array with system prompt
        const messages = [
            {
                role: 'system',
                content: `You are an intelligent ERP assistant for SimpleERP. You help users with:
- HR management (employees, attendance, payroll)
- Inventory management (products, stock)
- Sales and customer management
- Purchasing and supplier management
- Financial ledger and reports
- Project and task management

Be helpful, concise, and professional. Provide actionable advice for business operations.`
            },
            ...history.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ];

        const requestData = JSON.stringify({
            model: MODEL,
            messages: messages,
            max_tokens: 500,
            temperature: 0.7
        });

        const options = {
            hostname: 'openrouter.ai',
            port: 443,
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'SimpleERP Assistant'
            }
        };

        const apiRequest = https.request(options, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                try {
                    const parsed = JSON.parse(data);

                    if (parsed.error) {
                        console.error('OpenRouter error:', parsed.error);
                        return res.json({
                            reply: "I'm having trouble connecting right now. Please try again in a moment.",
                            error: true
                        });
                    }

                    const reply = parsed.choices?.[0]?.message?.content || "I couldn't generate a response.";
                    res.json({ reply });
                } catch (parseError) {
                    console.error('Parse error:', parseError);
                    res.json({ reply: "I encountered an error processing the response.", error: true });
                }
            });
        });

        apiRequest.on('error', (error) => {
            console.error('API request error:', error);
            res.json({ reply: "Connection error. Please check your internet and try again.", error: true });
        });

        apiRequest.write(requestData);
        apiRequest.end();

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

module.exports = router;
