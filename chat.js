let currentMode = 'friendly';
let currentTechnique = 'none';

function setChatMode(mode) {
    currentMode = mode;

    // Update Mode Buttons UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(mode));
    });

    // Update Header
    const title = document.getElementById('current-mentor-title');
    if (!title) return;
    if (mode === 'friendly') title.textContent = 'Friendly Mentor';
    if (mode === 'strict') title.textContent = 'Strict Mentor';
    if (mode === 'analytical') title.textContent = 'Analytical Mentor';
}

function setActiveTechnique(tech) {
    currentTechnique = tech;
    document.querySelectorAll('.tech-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `tech-${tech}`);
    });
    // Assuming createNotification function exists elsewhere or will be added
    // createNotification("Technique Activated", `Mentor is now using the ${tech.toUpperCase()} method.`, "🎓");
}

let currentUserMood = 'neutral';

function setUserMood(mood, emoji) {
    currentUserMood = mood;
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('title') === mood || btn.textContent.includes(emoji));
    });
    console.log("Current user mood set to:", mood);
}

async function getAIResponse(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message + "\n\nIMPORTANT: Respond in the same language as the user's message. If the user writes in Russian, respond in Russian. If the user writes in English, respond in English. Detect the language automatically.",
                mode: currentMode,
                mood: currentUserMood,
                technique: currentTechnique
            })
        });

        const data = await response.json();
        return data.response;
    } catch (e) {
        return "Sorry, I'm having trouble connecting to the server. Please try again later.";
    }
}

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');



sendBtn.onclick = async () => {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, true);
    userInput.value = '';
    userInput.style.height = 'auto'; // Reset height

    // Loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'msg-group ai loading';
    loadingDiv.innerHTML = '<div class="msg-avatar">AI</div><div class="msg-content"><p>Thinking...</p></div>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const response = await getAIResponse(text);

    chatMessages.removeChild(loadingDiv);
    addMessage(response, false);
};

// Auto-expand textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

// UI Logic using Event Delegation or Direct assignment if IDs exist

// Settings Modal Logic
function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('active');
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('active');
}

function updateSettings() {
    console.log("Settings updated");
    // specific logic for email toggle
    const emailToggle = document.getElementById('setting-email');
    const emailGroup = document.getElementById('email-input-group');
    if (emailToggle && emailGroup) {
        emailGroup.style.display = emailToggle.checked ? 'block' : 'none';
    }
}

function togglePush(checked) {
    if (checked) {
        if ("Notification" in window) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("FocusMate AI", { body: "Push-уведомления включены!" });
                }
            });
        }
    }
}

// Chat History State
let chats = [
    {
        id: 'init',
        title: 'Новый чат',
        messages: [],
        timestamp: new Date(),
        isPinned: false,
        isArchived: false
    }
];
let currentChatId = 'init';
let chatToArchiveId = null;

function saveCurrentChat() {
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;

    // We can grab messages from the DOM or we should have been saving them in addMessage
    // For simplicity, let's rely on the 'chats' state being updated in addMessage

    // Update title based on first user message if it's still "Новый чат"
    const userMsg = chat.messages.find(m => m.isUser);
    if (userMsg && chat.title === 'Новый чат') {
        chat.title = userMsg.text.substring(0, 20) + (userMsg.text.length > 20 ? '...' : '');
        renderHistorySidebar();
    }
}

function createNewChat() {
    saveCurrentChat();

    const newId = 'chat_' + Date.now();
    const newChat = {
        id: newId,
        title: 'Новый чат',
        messages: [],
        timestamp: new Date(),
        isPinned: false,
        isArchived: false
    };

    chats.unshift(newChat); // Add to top
    currentChatId = newId;

    renderHistorySidebar();
    loadChat(newId);
}

function loadChat(id) {
    saveCurrentChat(); // Save previous before switching
    currentChatId = id;

    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    // Clear DOM
    chatMessages.innerHTML = '';

    // Re-render messages if any exist
    chat.messages.forEach(msg => {
        renderMessageToDOM(msg.text, msg.isUser, msg.time);
    });

    renderHistorySidebar();
}

function renderMessageToDOM(text, isUser, time) {
    const msgGroup = document.createElement('div');
    msgGroup.className = `msg-group ${isUser ? 'user' : 'ai'}`;

    msgGroup.innerHTML = `
        ${isUser ? '' : '<div class="msg-avatar">AI</div>'}
        <div class="msg-content">
            <p>${text}</p>
            <span class="msg-time">${time}</span>
        </div>
    `;

    chatMessages.appendChild(msgGroup);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderHistorySidebar() {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;

    historyList.innerHTML = '';

    // Sort: Pinned first, then by timestamp
    const sortedChats = [...chats].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp - a.timestamp;
    });

    sortedChats.forEach(chat => {
        if (chat.isArchived) return; // Don't show archived in main list

        const item = document.createElement('div');
        item.className = `history-item ${chat.id === currentChatId ? 'active' : ''} ${chat.isPinned ? 'pinned' : ''}`;

        item.innerHTML = `
            <span class="history-item-title">${chat.isPinned ? '📌 ' : ''}${chat.title}</span>
            <button class="history-options-btn">⋮</button>
            <div class="history-options-menu">
                <button class="menu-item mini" onclick="event.stopPropagation(); togglePinChat('${chat.id}')">${chat.isPinned ? '📍 Открепить' : '📌 Закрепить'}</button>
                <button class="menu-item mini" onclick="event.stopPropagation(); renameChat('${chat.id}')">✏️ Переименовать</button>
                <button class="menu-item mini" onclick="event.stopPropagation(); openArchiveConfirmation('${chat.id}')">📦 В архив</button>
                <button class="menu-item mini danger" onclick="event.stopPropagation(); deleteChat('${chat.id}')">🗑️ Удалить</button>
            </div>
        `;

        item.onclick = (e) => {
            if (e.target.classList.contains('history-options-btn')) {
                e.stopPropagation();
                const menu = item.querySelector('.history-options-menu');
                document.querySelectorAll('.history-options-menu').forEach(m => {
                    if (m !== menu) m.classList.remove('active');
                });
                menu.classList.toggle('active');
                return;
            }
            loadChat(chat.id);
        };

        historyList.appendChild(item);
    });
}

function togglePinChat(id) {
    const chat = chats.find(c => c.id === id);
    if (chat) {
        chat.isPinned = !chat.isPinned;
        renderHistorySidebar();
    }
}

function openArchiveConfirmation(id) {
    chatToArchiveId = id;
    const modal = document.getElementById('archive-modal');
    if (modal) modal.classList.add('active');
}

function closeArchiveModal() {
    const modal = document.getElementById('archive-modal');
    if (modal) modal.classList.remove('active');
    chatToArchiveId = null;
}

const confirmArchiveBtn = document.getElementById('confirm-archive-btn');
if (confirmArchiveBtn) {
    confirmArchiveBtn.onclick = () => {
        if (chatToArchiveId) {
            const chat = chats.find(c => c.id === chatToArchiveId);
            if (chat) {
                chat.isArchived = true;
                chat.isPinned = false; // Unpin when archiving

                if (chatToArchiveId === currentChatId) {
                    const nextChat = chats.find(c => !c.isArchived);
                    if (nextChat) loadChat(nextChat.id);
                    else createNewChat();
                } else {
                    renderHistorySidebar();
                }
            }
            closeArchiveModal();
            renderArchivedChats(); // Update settings list
        }
    };
}

function renderArchivedChats() {
    const list = document.getElementById('archived-chats-list');
    if (!list) return;

    const archived = chats.filter(c => c.isArchived);
    if (archived.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Нет архивированных чатов</p>';
        return;
    }

    list.innerHTML = '';
    archived.forEach(chat => {
        const item = document.createElement('div');
        item.className = 'archived-item';
        item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-sidebar); border-radius: 8px; margin-bottom: 0.5rem;';
        item.innerHTML = `
            <span style="font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${chat.title}</span>
            <button class="action-btn mini" onclick="restoreChat('${chat.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Восстановить</button>
        `;
        list.appendChild(item);
    });
}

function restoreChat(id) {
    const chat = chats.find(c => c.id === id);
    if (chat) {
        chat.isArchived = false;
        renderHistorySidebar();
        renderArchivedChats();
    }
}

function renameChat(id) {
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    const newTitle = prompt("Введите новое название чата:", chat.title);
    if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        renderHistorySidebar();
    }
}

function deleteChat(id) {
    if (!confirm("Вы уверены, что хотите удалить этот чат?")) return;

    const index = chats.findIndex(c => c.id === id);
    if (index === -1) return;

    chats.splice(index, 1);

    if (id === currentChatId) {
        if (chats.length > 0) {
            loadChat(chats[0].id);
        } else {
            // Create a new empty chat if all are deleted
            createNewChat();
        }
    } else {
        renderHistorySidebar();
    }
}

// Global click listener to close history menus
document.addEventListener('click', (e) => {
    if (!e.target.closest('.history-options-btn')) {
        document.querySelectorAll('.history-options-menu').forEach(m => m.classList.remove('active'));
    }
});

// Modify global addMessage to update state
function addMessage(text, isUser = false) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Save to state
    const chat = chats.find(c => c.id === currentChatId);
    if (chat) {
        chat.messages.push({ text, isUser, time });

        // Update Title if needed
        if (isUser && chat.title === 'Новый чат') {
            chat.title = text.substring(0, 20) + (text.length > 20 ? '...' : '');
            renderHistorySidebar();
        }
    }

    renderMessageToDOM(text, isUser, time);
}

// New Chat Button Listener
const newChatBtn = document.getElementById('btn-new-chat');
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        createNewChat();
    });
}

// Initialize Sidebar on Load
document.addEventListener('DOMContentLoaded', () => {
    renderHistorySidebar();
});

// Attachments Logic
const attachBurgerBtn = document.getElementById('attach-burger-btn');
const attachMenu = document.getElementById('attach-menu');
const photoInput = document.getElementById('photo-input');
const fileInput = document.getElementById('file-input');
const attachmentPreview = document.getElementById('attachment-preview');

let selectedAttachments = [];

if (attachBurgerBtn) {
    attachBurgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        attachMenu.classList.toggle('active');
    });
}

// Close menu when clicking outside
document.addEventListener('click', () => {
    if (attachMenu) attachMenu.classList.remove('active');
});

function handleAttachments(files, type) {
    const fileList = Array.from(files);

    if (type === 'photo') {
        if (fileList.length > 3) {
            alert('Можно выбрать не более 3 фото одновременно.');
            return;
        }
    }

    fileList.forEach(file => {
        selectedAttachments.push({ file, type });
    });

    renderAttachmentPreviews();
}

if (photoInput) {
    photoInput.addEventListener('change', (e) => {
        handleAttachments(e.target.files, 'photo');
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        handleAttachments(e.target.files, 'file');
    });
}

function renderAttachmentPreviews() {
    if (!attachmentPreview) return;
    attachmentPreview.innerHTML = '';

    selectedAttachments.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <span>${item.type === 'photo' ? '🖼️' : '📁'} ${item.file.name.substring(0, 15)}...</span>
            <span class="remove-attach" onclick="removeAttachment(${index})">✕</span>
        `;
        attachmentPreview.appendChild(div);
    });
}

function removeAttachment(index) {
    selectedAttachments.splice(index, 1);
    renderAttachmentPreviews();
}

// Update send logic to include attachments (visual only for now)
const originalSend = sendBtn.onclick;
sendBtn.onclick = async () => {
    const text = userInput.value.trim();
    if (!text && selectedAttachments.length === 0) return;

    // Build attachment text for visualization
    let attachmentText = '';
    if (selectedAttachments.length > 0) {
        attachmentText = '\n\n📎 Прикреплено: ' + selectedAttachments.map(a => a.file.name).join(', ');
    }

    addMessage(text + attachmentText, true);
    userInput.value = '';
    userInput.style.height = 'auto';

    // Clear attachments
    selectedAttachments = [];
    renderAttachmentPreviews();

    // Loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'msg-group ai loading';
    loadingDiv.innerHTML = '<div class="msg-avatar">AI</div><div class="msg-content"><p>Thinking...</p></div>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const response = await getAIResponse(text);

    chatMessages.removeChild(loadingDiv);
    addMessage(response, false);
};

// Mobile Sidebar Toggle
const mobileSidebarOpen = document.getElementById('mobile-sidebar-open');
const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
const sidebar = document.querySelector('.sidebar');

if (mobileSidebarOpen && sidebar) {
    mobileSidebarOpen.onclick = () => {
        sidebar.classList.add('active');
    };
}

if (mobileSidebarToggle && sidebar) {
    mobileSidebarToggle.onclick = () => {
        sidebar.classList.remove('active');
    };
}

// Close sidebar on item click (mobile)
document.querySelectorAll('.mode-item, .history-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('active');
        }
    });
});

// Enhanced mobile functionality
document.addEventListener('DOMContentLoaded', () => {
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 992 && sidebar) {
                sidebar.classList.remove('active');
            }
        }, 250);
    });

    // Close sidebar when clicking outside (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !mobileSidebarOpen.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Prevent sidebar from closing when clicking inside
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Mobile keyboard optimization
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.addEventListener('focus', () => {
            if (window.innerWidth <= 768) {
                document.body.style.height = '100vh';
                document.body.style.overflow = 'hidden';
            }
        });

        userInput.addEventListener('blur', () => {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    document.body.style.height = '';
                    document.body.style.overflow = '';
                }, 300);
            }
        });
    }

    // Touch feedback for mobile buttons
    const touchButtons = document.querySelectorAll('.action-btn, .mode-btn, .tech-btn, .mood-btn');
    touchButtons.forEach(btn => {
        btn.addEventListener('touchstart', () => {
            btn.style.transform = 'scale(0.95)';
        });

        btn.addEventListener('touchend', () => {
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        });

        btn.addEventListener('touchcancel', () => {
            btn.style.transform = '';
        });
    });

    // Improved mobile scrolling
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        let isScrolling = false;
        
        chatMessages.addEventListener('scroll', () => {
            if (!isScrolling) {
                chatMessages.classList.add('scrolling');
            }
            
            clearTimeout(isScrolling);
            isScrolling = setTimeout(() => {
                chatMessages.classList.remove('scrolling');
            }, 150);
        });
    }

    // Mobile viewport height fix
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
    });
});

// Add CSS custom property support for mobile
const style = document.createElement('style');
style.textContent = `
    .chat-messages-container {
        height: calc(100vh - 200px);
        height: calc(var(--vh, 1vh) * 100 - 200px);
    }
    
    @media (max-width: 768px) {
        .chat-messages-container {
            height: calc(var(--vh, 1vh) * 100 - 200px);
        }
    }
    
    @media (max-width: 480px) {
        .chat-messages-container {
            height: calc(var(--vh, 1vh) * 100 - 180px);
        }
    }
`;
document.head.appendChild(style);
