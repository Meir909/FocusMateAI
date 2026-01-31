function openAccountModal() {
    document.getElementById('account-modal').classList.add('active');
    loadProfileData();
}

function closeAccountModal() {
    document.getElementById('account-modal').classList.remove('active');
}

function loadProfileData() {
    const profile = JSON.parse(localStorage.getItem('focusmate_profile')) || { name: 'User Name', sound: true, darkMode: false, lang: 'en', zen: false };
    document.getElementById('input-username').value = profile.name || 'User Name';
    document.getElementById('setting-sounds').checked = profile.sound;
    document.getElementById('setting-dark-mode').checked = !!profile.darkMode;
    document.getElementById('setting-lang').value = profile.lang || 'en';
    document.getElementById('setting-zen-mode').checked = !!profile.zen;

    if (profile.darkMode) document.body.classList.add('dark-theme');
    if (profile.zen) toggleZenMode(true);

    updateUIProfile(profile.name || 'User Name');
}

function updateProfile() {
    const name = document.getElementById('input-username').value || 'User Name';
    const profile = JSON.parse(localStorage.getItem('focusmate_profile')) || {};
    profile.name = name;
    localStorage.setItem('focusmate_profile', JSON.stringify(profile));
    updateUIProfile(name);
}

function updateUIProfile(name) {
    document.getElementById('sidebar-name').textContent = name;
    document.getElementById('sidebar-avatar').textContent = name.charAt(0).toUpperCase();
    document.getElementById('modal-avatar').textContent = name.charAt(0).toUpperCase();
}

function updateAccountSettings() {
    const profile = JSON.parse(localStorage.getItem('focusmate_profile')) || {};
    profile.sound = document.getElementById('setting-sounds').checked;
    profile.lang = document.getElementById('setting-lang').value;
    localStorage.setItem('focusmate_profile', JSON.stringify(profile));

    if (profile.sound) console.log("Sound enabled");
    createNotification("Settings", "Account preferences updated!", "⚙️");
}

function toggleDarkMode(enabled) {
    document.body.classList.toggle('dark-theme', enabled);
    const profile = JSON.parse(localStorage.getItem('focusmate_profile')) || {};
    profile.darkMode = enabled;
    localStorage.setItem('focusmate_profile', JSON.stringify(profile));
}

function toggleZenMode(enabled) {
    document.body.classList.toggle('zen-mode-active', enabled);
    const profile = JSON.parse(localStorage.getItem('focusmate_profile')) || {};
    profile.zen = enabled;
    localStorage.setItem('focusmate_profile', JSON.stringify(profile));

    if (enabled) {
        createNotification("Zen Mode", "Deep focus mode active. Stay focused!", "🧘");
    }
}

function connectCalendar() {
    createNotification("Google Calendar", "Redirecting to sync permissions...", "📅");
    setTimeout(() => {
        alert("Integrations are in beta. In a full version, this would open OAuth flow.");
    }, 1000);
}

function openSupport() {
    alert("FocusMate AI Support: support@focusmate.ai \nFAQ: How to use Zen Mode? Just click the toggle!");
}

function exportData() {
    const tasks = localStorage.getItem('focusmate_tasks');
    const blob = new Blob([tasks], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'focusmate_tasks.json';
    a.click();
}

function clearData() {
    if (confirm("Are you sure? This will delete all tasks and progress history!")) {
        localStorage.removeItem('focusmate_tasks');
        location.reload();
    }
}

// Initialize profile on start
document.addEventListener('DOMContentLoaded', loadProfileData);
