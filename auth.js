document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const toggleAuth = document.getElementById('toggle-auth');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('submit-btn');
    const toggleText = document.getElementById('toggle-text');
    const nameGroup = document.getElementById('name-group');
    const googleBtn = document.getElementById('google-login-btn');

    let isLogin = true;

    // Toggle between Login and Register
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;

        if (isLogin) {
            authTitle.textContent = 'С возвращением!';
            authSubtitle.textContent = 'Войдите в свой аккаунт, чтобы продолжить работу.';
            submitBtn.textContent = 'Войти';
            toggleText.innerHTML = 'Ещё нет аккаунта? <a href="#" id="toggle-auth">Зарегистрироваться</a>';
            nameGroup.style.display = 'none';
        } else {
            authTitle.textContent = 'Создать аккаунт';
            authSubtitle.textContent = 'Присоединяйтесь к FocusMate и достигайте большего.';
            submitBtn.textContent = 'Зарегистрироваться';
            toggleText.innerHTML = 'Уже есть аккаунт? <a href="#" id="toggle-auth">Войти</a>';
            nameGroup.style.display = 'flex';
        }

        // Re-attach event listener to the new link
        document.getElementById('toggle-auth').addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuth.click();
        });
    });

    // Form submission
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;

        // Simulation focus
        submitBtn.textContent = isLogin ? 'Вход...' : 'Создание...';
        submitBtn.disabled = true;

        setTimeout(() => {
            alert(isLogin ? `Успешный вход: ${email}` : `Аккаунт создан для: ${email}`);
            window.location.href = 'chat.html';
        }, 1500);
    });

    // Google Login Simulation
    googleBtn.addEventListener('click', () => {
        googleBtn.innerHTML = '<img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" width="20"> Подключение...';
        googleBtn.disabled = true;

        setTimeout(() => {
            // In a real app, this would redirect to Google OAuth or use GSI
            alert('Связь с Google установлена! Переход в чат...');
            window.location.href = 'chat.html';
        }, 1500);
    });
});
