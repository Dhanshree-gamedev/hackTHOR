/**
 * AI Chatbot Module
 */

let chatHistory = [];
let chatOpen = false;

function initChatbot() {
    // Add chatbot HTML to page
    const chatbotHTML = `
        <div id="chatbot-container" class="chatbot-container">
            <button id="chatbot-toggle" class="chatbot-toggle" onclick="toggleChat()">
                <i class="bi bi-chat-dots-fill"></i>
                <span class="chat-badge" id="chatBadge" style="display:none;">1</span>
            </button>
            <div id="chatWindow" class="chat-window" style="display:none;">
                <div class="chat-header">
                    <div class="chat-header-title">
                        <i class="bi bi-robot me-2"></i>
                        ERP Assistant
                    </div>
                    <button class="chat-close" onclick="toggleChat()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-message bot">
                        <div class="message-avatar"><i class="bi bi-robot"></i></div>
                        <div class="message-content">
                            Hello! I'm your ERP Assistant. I can help you with:
                            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                                <li>HR & Payroll questions</li>
                                <li>Inventory management</li>
                                <li>Sales & customer info</li>
                                <li>Financial reports</li>
                            </ul>
                            How can I assist you today?
                        </div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <input type="text" id="chatInput" class="chat-input" placeholder="Type your message..." 
                           onkeypress="if(event.key==='Enter')sendChatMessage()">
                    <button class="chat-send" onclick="sendChatMessage()">
                        <i class="bi bi-send-fill"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // Add chatbot styles
    const styles = `
        <style>
            .chatbot-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9999;
                font-family: 'Segoe UI', sans-serif;
            }
            
            .chatbot-toggle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
                position: relative;
            }
            
            .chatbot-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 30px rgba(102, 126, 234, 0.5);
            }
            
            .chat-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #dc3545;
                color: white;
                border-radius: 50%;
                width: 22px;
                height: 22px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .chat-window {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 380px;
                height: 520px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .chat-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chat-header-title {
                font-weight: 600;
                font-size: 16px;
            }
            
            .chat-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .chat-close:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: #f8f9fa;
            }
            
            .chat-message {
                display: flex;
                gap: 10px;
                margin-bottom: 16px;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .chat-message.user {
                flex-direction: row-reverse;
            }
            
            .message-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .chat-message.bot .message-avatar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .chat-message.user .message-avatar {
                background: #e9ecef;
                color: #495057;
            }
            
            .message-content {
                max-width: 75%;
                padding: 12px 16px;
                border-radius: 16px;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .chat-message.bot .message-content {
                background: white;
                color: #333;
                border-bottom-left-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            
            .chat-message.user .message-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-bottom-right-radius: 4px;
            }
            
            .chat-input-container {
                padding: 16px;
                background: white;
                border-top: 1px solid #e9ecef;
                display: flex;
                gap: 10px;
            }
            
            .chat-input {
                flex: 1;
                border: 1px solid #e9ecef;
                border-radius: 24px;
                padding: 12px 20px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }
            
            .chat-input:focus {
                border-color: #667eea;
            }
            
            .chat-send {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .chat-send:hover {
                transform: scale(1.05);
            }
            
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
            }
            
            .typing-dot {
                width: 8px;
                height: 8px;
                background: #adb5bd;
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }
            
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-6px); }
            }
            
            @media (max-width: 480px) {
                .chat-window {
                    width: calc(100vw - 48px);
                    height: 70vh;
                }
            }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
}

function toggleChat() {
    chatOpen = !chatOpen;
    const chatWindow = document.getElementById('chatWindow');
    const badge = document.getElementById('chatBadge');

    if (chatOpen) {
        chatWindow.style.display = 'flex';
        badge.style.display = 'none';
        document.getElementById('chatInput').focus();
    } else {
        chatWindow.style.display = 'none';
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    input.value = '';

    // Add user message
    addChatMessage(message, 'user');
    chatHistory.push({ role: 'user', content: message });

    // Show typing indicator
    showTyping();

    try {
        const response = await api.post('/chat', {
            message: message,
            history: chatHistory
        });

        hideTyping();

        const reply = response.data?.reply || response.error || "I couldn't process that request.";
        addChatMessage(reply, 'bot');
        chatHistory.push({ role: 'assistant', content: reply });

    } catch (error) {
        hideTyping();
        addChatMessage("Sorry, I'm having trouble connecting. Please try again.", 'bot');
    }
}

function addChatMessage(content, type) {
    const messages = document.getElementById('chatMessages');
    const icon = type === 'bot' ? 'bi-robot' : 'bi-person-fill';

    const messageHTML = `
        <div class="chat-message ${type}">
            <div class="message-avatar"><i class="bi ${icon}"></i></div>
            <div class="message-content">${formatMessage(content)}</div>
        </div>
    `;

    messages.insertAdjacentHTML('beforeend', messageHTML);
    messages.scrollTop = messages.scrollHeight;
}

function formatMessage(text) {
    // Convert markdown-like formatting
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function showTyping() {
    const messages = document.getElementById('chatMessages');
    const typingHTML = `
        <div class="chat-message bot" id="typingIndicator">
            <div class="message-avatar"><i class="bi bi-robot"></i></div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    messages.insertAdjacentHTML('beforeend', typingHTML);
    messages.scrollTop = messages.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

// Initialize chatbot when app loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initChatbot, 1000);
});
