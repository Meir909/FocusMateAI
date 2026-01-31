let currentMode = 'friendly';

function switchMode(mode) {
    currentMode = mode;
    // Buttons
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Find the clicked button (simplistic check for demo)
    const clickedBtn = Array.from(buttons).find(b => b.textContent.toLowerCase().includes(mode));
    if (clickedBtn) clickedBtn.classList.add('active');

    // Content
    const title = document.querySelector('#mode-description h3');
    const text = document.querySelector('#mode-description p');
    const tag = document.querySelector('#mode-description .tag');
    const label = document.querySelector('#current-mode-label');

    if (label) label.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);

    if (mode === 'friendly') {
        title.textContent = 'Friendly Mode';
        text.textContent = '"Hey! You did great yesterday. Don\'t worry about the slip-up, let\'s just do 10 minutes today."';
        tag.textContent = 'Best for: Burnout & Stress';
    } else if (mode === 'strict') {
        title.textContent = 'Strict Mode';
        text.textContent = '"You have missed your deadline twice. No more excuses. Sit down and work for 25 minutes. Now."';
        tag.textContent = 'Best for: Hard Deadlines & Discipline';
    } else if (mode === 'analytical') {
        title.textContent = 'Analytical Mode';
        text.textContent = '"Analysis shows your productivity drops by 40% after 2 PM. I have rescheduled your deep work to 10 AM."';
        tag.textContent = 'Best for: Optimization & Data Lovers';
    }
}

// Chat Widget Logic
document.addEventListener('DOMContentLoaded', () => {
    const chatTrigger = document.getElementById('chat-trigger');
    const chatWidget = document.getElementById('chat-widget');
    const closeChat = document.getElementById('close-chat');
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    // Enhanced chat trigger functionality
    if (chatTrigger) {
        chatTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle chat widget
            const isHidden = chatWidget.classList.contains('hidden');
            chatWidget.classList.toggle('hidden');
            
            // Focus input when opening
            if (isHidden && userInput) {
                setTimeout(() => {
                    userInput.focus();
                }, 300);
            }
            
            // Add visual feedback
            chatTrigger.style.transform = 'scale(0.95)';
            setTimeout(() => {
                chatTrigger.style.transform = '';
            }, 150);
        });

        // Add touch feedback for mobile
        chatTrigger.addEventListener('touchstart', () => {
            chatTrigger.style.transform = 'scale(0.95)';
        });

        chatTrigger.addEventListener('touchend', () => {
            setTimeout(() => {
                chatTrigger.style.transform = '';
            }, 150);
        });
    }

    if (closeChat) closeChat.onclick = () => chatWidget.classList.add('hidden');

    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function getAIResponse(userText) {
        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userText,
                    mode: currentMode
                })
            });

            const data = await response.json();
            if (data.error) return "Error: " + data.error;
            return data.response;
        } catch (error) {
            console.error('Fetch Error:', error);
            return "Failed to connect to server. Make sure backend is running (node server.js).";
        }
    }

    if (sendBtn) {
        sendBtn.onclick = async () => {
            const text = userInput.value.trim();
            if (!text) return;

            addMessage(text, true);
            userInput.value = '';

            // Показываем индикатор загрузки
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'message ai-message';
            loadingMsg.style.fontStyle = 'italic';
            loadingMsg.textContent = 'Думаю...';
            chatMessages.appendChild(loadingMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            const response = await getAIResponse(text);

            chatMessages.removeChild(loadingMsg);
            addMessage(response, false);
        };
    }


    if (userInput) {
        userInput.onkeypress = (e) => {
            if (e.key === 'Enter') sendBtn.click();
        };

        // Mobile keyboard optimization
        userInput.addEventListener('focus', () => {
            // On mobile, adjust chat widget position when keyboard appears
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    chatWidget.style.bottom = '20px';
                }, 300);
            }
        });

        userInput.addEventListener('blur', () => {
            // Reset position when keyboard disappears
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    chatWidget.style.bottom = '';
                }, 300);
            }
        });
    }

    // Close chat when clicking outside (mobile friendly)
    document.addEventListener('click', (e) => {
        if (chatTrigger && chatWidget && !chatWidget.classList.contains('hidden')) {
            if (!chatWidget.contains(e.target) && !chatTrigger.contains(e.target)) {
                chatWidget.classList.add('hidden');
            }
        }
    });

    // Prevent chat from closing when clicking inside
    if (chatWidget) {
        chatWidget.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});

// Additional interactive logic for "beauty" buttons
document.addEventListener('DOMContentLoaded', () => {
    // Navigation 'Try for Free' button
    const navTryBtn = document.getElementById('nav-try-btn');
    if (navTryBtn) {
        navTryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'auth.html';
        });
    }

    // Hero 'View Demo' button - opens the chat widget
    const heroDemoBtn = document.getElementById('hero-demo-btn');
    if (heroDemoBtn) {
        heroDemoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const chatWidget = document.getElementById('chat-widget');
            if (chatWidget) {
                chatWidget.classList.remove('hidden');
                // Optional: add a welcome message specific to demo
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    const demoMsg = document.createElement('div');
                    demoMsg.className = 'message ai-message';
                    demoMsg.textContent = "Добро пожаловать в демо! Попробуйте написать 'привет' или 'составь план'.";
                    chatMessages.appendChild(demoMsg);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        });
    }

    // Pricing 'Get Started' (Free)
    const pricingFreeBtn = document.getElementById('pricing-free-btn');
    if (pricingFreeBtn) {
        // Pricing: Base (Free)
        const pricingBaseBtn = document.getElementById('pricing-base-btn');
        if (pricingBaseBtn) {
            pricingBaseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'auth.html';
            });
        }

        // Paid Plans & Vouchers Handler
        const paidButtons = [
            'pricing-focus-btn',
            'pricing-control-btn',
            'voucher-weekly-btn',
            'voucher-monthly-btn'
        ];

        paidButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('Тарифные планы пока что не работают.');
                });
            }
        });

        // Footer Links (Privacy, Terms, Contact)
        const footerLinks = document.querySelectorAll('.footer-link');
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const linkText = link.textContent;
                alert(`Страница '${linkText}' находится в разработке. Пожалуйста, зайдите позже!`);
            });
        });
    }
});
