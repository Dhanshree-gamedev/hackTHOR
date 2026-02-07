const express = require('express');
const router = express.Router();
const https = require('https');
const { authenticate } = require('../middleware/auth');
const { getContextString } = require('../services/crawler');

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = 'stepfun/step-3.5-flash:free';

router.use(authenticate);

// POST /api/chat - Send message to AI with website context
router.post('/', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!OPENROUTER_API_KEY) {
            return res.json({
                reply: "The AI assistant is not configured. Please set the OPENROUTER_API_KEY environment variable.",
                error: true
            });
        }

        // Fetch website context dynamically
        const websiteContext = getContextString();

        // Build system prompt with website content
        const systemPrompt = `You are SimpleERP Assistant, an AI helper for the SimpleERP system.

IMPORTANT RULES:
1. You MUST answer questions ONLY using the website knowledge base provided below.
2. NEVER say "I don't have access to your website" or similar phrases.
3. If the information is not in the knowledge base, say: "Please contact support for this information."
4. Be helpful, concise, and professional.
5. Guide users on how to use specific ERP features.

${websiteContext}

Remember: Only use the information above to answer questions. Do not make up features or capabilities not listed.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10),
            { role: 'user', content: message }
        ];

        const requestData = JSON.stringify({
            model: MODEL,
            messages: messages,
            max_tokens: 600,
            temperature: 0.5
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

                    const reply = parsed.choices?.[0]?.message?.content ||
                        "Please contact support for this information.";
                    res.json({ reply });
                } catch (parseError) {
                    console.error('Parse error:', parseError);
                    res.json({ reply: "Please contact support for this information.", error: true });
                }
            });
        });

        apiRequest.on('error', (error) => {
            console.error('API request error:', error);
            res.json({ reply: "Connection error. Please contact support for assistance.", error: true });
        });

        apiRequest.write(requestData);
        apiRequest.end();

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

module.exports = router;
