// TRELLO(JSTD-002-2)
// TRELLO(JSTD-003-3)
// TRELLO(JSTD-005-1)

const drawer = document.getElementById('category-panel');
const openBtn = document.getElementById('open-categories');
const closeBtnDrawer = document.getElementById('close-drawer');

if (openBtn && drawer && closeBtnDrawer) {
    openBtn.addEventListener('click', () => drawer.classList.add('open'));
    closeBtnDrawer.addEventListener('click', () => drawer.classList.remove('open'));
}

const loginBtn = document.querySelector('.login-btn-fixed');
const loginModal = document.getElementById('login-modal');
const closeLoginBtn = document.getElementById('close-login');

const loginFormContainer = document.getElementById('login-form-container');
const registerFormContainer = document.getElementById('register-form-container');
const btnToRegister = document.getElementById('btn-to-register');
const btnToLogin = document.getElementById('btn-to-login');

if (loginBtn && loginModal) {
    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

if (btnToRegister) {
    btnToRegister.addEventListener('click', () => {
        loginFormContainer.style.display = 'none';
        registerFormContainer.style.display = 'block';
    });
}

if (btnToLogin) {
    btnToLogin.addEventListener('click', () => {
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
    });
}

function closeModal() {
    loginModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    setTimeout(() => {
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
    }, 300);
}

if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        closeModal();
    }
    if (event.target === drawer) {
        drawer.classList.remove('open');
    }
});

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const inputs = e.target.querySelectorAll('input');
        const identifier = inputs[0].value; 
        const password = inputs[1].value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Sikeres bejelentkezés! Üdv, ${data.username}!`);
                closeModal();
                loginBtn.textContent = data.username;
            } else {
                alert(`Sikertelen bejelentkezés: ${data.error}`);
            }
        } catch (error) {
            console.error('Hiba:', error);
            alert('Hálózati hiba történt.');
        }
    });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = e.target.querySelectorAll('input');
        const email = inputs[0].value;
        const username = inputs[1].value;
        const password = inputs[2].value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Sikeres regisztráció! Most már bejelentkezhetsz.');
                btnToLogin.click();
                e.target.reset(); 
            } else {
                alert(`Sikertelen regisztráció: ${data.error}`);
            }
        } catch (error) {
            console.error('Hiba:', error);
            alert('Hálózati hiba történt.');
        }
    });
}