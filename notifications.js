let idleTime = 0;
let idleInterval = null;

// Settings with defaults
let userSettings = JSON.parse(localStorage.getItem('focusmate_settings')) || {
    intensity: 'medium',
    pushEnabled: false,
    emailEnabled: false,
    emailAddr: ''
};

const INTENSITY_MAP = {
    'low': 60 * 15,    // 15 mins
    'medium': 60 * 5,  // 5 mins
    'high': 60 * 1     // 1 min
};

function initNotifications() {
    if (!document.querySelector('.notification-container')) {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    startIdleTimer();

    window.onmousemove = resetIdleTimer;
    window.onkeydown = resetIdleTimer;
    window.onclick = resetIdleTimer;
    window.onscroll = resetIdleTimer;

    // Apply settings to UI
    syncSettingsUI();
}

function syncSettingsUI() {
    const intensityEl = document.getElementById('setting-intensity');
    const pushEl = document.getElementById('setting-push');
    const emailEl = document.getElementById('setting-email');
    const emailAddrEl = document.getElementById('setting-email-addr');
    const emailGroup = document.getElementById('email-input-group');

    if (intensityEl) intensityEl.value = userSettings.intensity;
    if (pushEl) pushEl.checked = userSettings.pushEnabled;
    if (emailEl) emailEl.checked = userSettings.emailEnabled;
    if (emailAddrEl) emailAddrEl.value = userSettings.emailAddr;
    if (emailGroup) emailGroup.style.display = userSettings.emailEnabled ? 'block' : 'none';
}

function updateSettings() {
    userSettings.intensity = document.getElementById('setting-intensity').value;
    userSettings.emailEnabled = document.getElementById('setting-email').checked;
    userSettings.emailAddr = document.getElementById('setting-email-addr').value;

    document.getElementById('email-input-group').style.display = userSettings.emailEnabled ? 'block' : 'none';

    localStorage.setItem('focusmate_settings', JSON.stringify(userSettings));
    resetIdleTimer(); // Restart timer with new intensity
}

async function togglePush(enabled) {
    if (enabled) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            alert("Please enable notification permissions in your browser settings.");
            document.getElementById('setting-push').checked = false;
            userSettings.pushEnabled = false;
        } else {
            userSettings.pushEnabled = true;
            createNotification("Systems Ready", "Browser push notifications enabled!", "🔔");
        }
    } else {
        userSettings.pushEnabled = false;
    }
    localStorage.setItem('focusmate_settings', JSON.stringify(userSettings));
}

function startIdleTimer() {
    if (idleInterval) clearInterval(idleInterval);
    idleInterval = setInterval(timerIncrement, 1000);
}

function timerIncrement() {
    idleTime++;
    const limit = INTENSITY_MAP[userSettings.intensity] || 300;

    if (idleTime >= limit) {
        showFocusReminder();
        resetIdleTimer();
    }
}

function resetIdleTimer() {
    idleTime = 0;
}

async function showFocusReminder() {
    const mode = (typeof currentMode !== 'undefined') ? currentMode : 'friendly';
    const mood = (typeof currentUserMood !== 'undefined') ? currentUserMood : 'neutral';

    // Adaptive logic: Check progress
    const tasks = JSON.parse(localStorage.getItem('focusmate_tasks')) || [];
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const todoCount = tasks.filter(t => t.status === 'todo').length;

    let progressContext = `The user has finished ${doneCount} tasks but still has ${todoCount} tasks left. `;
    let prompt = `${progressContext} The user is currently idle. Give a short, adaptive nudge based on this progress. `;

    if (todoCount === 0) {
        prompt = "User is idle but has no tasks left! Suggest taking a break or planning the next big win.";
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt, mode: mode, mood: mood })
        });
        const data = await response.json();
        const nudge = data.response;

        // In-app Notification
        createNotification("FocusMate Nudge", nudge, mode === 'strict' ? '😤' : '😇');

        // Browser Push
        if (userSettings.pushEnabled && Notification.permission === 'granted') {
            new Notification("FocusMate AI", { body: nudge, icon: 'favicon.ico' });
        }

        // Email (Simulation or Server call)
        if (userSettings.emailEnabled && userSettings.emailAddr) {
            fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userSettings.emailAddr, subject: "Focus Reminder", message: nudge })
            }).catch(e => console.log("Email failed (local server only)"));
        }

    } catch (e) {
        createNotification("FocusMate", "Time to get back to your tasks!", "💡");
    }
}

function openSettings() { document.getElementById('settings-modal').classList.add('active'); }
function closeSettings() { document.getElementById('settings-modal').classList.remove('active'); }

function createNotification(title, text, icon) {
    const container = document.querySelector('.notification-container');
    const toast = document.createElement('div');
    toast.className = 'notif-toast';
    toast.innerHTML = `
        <div class="notif-icon">${icon}</div>
        <div class="notif-content">
            <div class="notif-title">${title}</div>
            <div class="notif-text">${text}</div>
        </div>
        <button class="notif-close" onclick="this.parentElement.classList.remove('active'); setTimeout(() => this.parentElement.remove(), 400);">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('active'), 100);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 400);
        }
    }, 10000);
}

document.addEventListener('DOMContentLoaded', initNotifications);
