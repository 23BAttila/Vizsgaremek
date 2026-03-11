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
const userDropdown = document.getElementById('user-dropdown');
const userDropdownName = document.getElementById('user-dropdown-name');
const dropdownLogout = document.getElementById('dropdown-logout');

const loginFormContainer = document.getElementById('login-form-container');
const registerFormContainer = document.getElementById('register-form-container');
const btnToRegister = document.getElementById('btn-to-register');
const btnToLogin = document.getElementById('btn-to-login');

let isLoggedIn = false;

if (loginBtn && loginModal) {
    loginBtn.addEventListener('click', () => {
        if (isLoggedIn) {
            userDropdown.classList.toggle('open');
        } else {
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
}
document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.contains(e.target) && e.target !== loginBtn) {
        userDropdown.classList.remove('open');
    }
});

if (dropdownLogout) {
    dropdownLogout.addEventListener('click', () => {
        isLoggedIn = false;
        loginBtn.textContent = 'Login';
        userDropdown.classList.remove('open');
        if (userDropdownName) userDropdownName.textContent = '';
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
const popup_good = document.createElement('div');
const popup_bad = document.createElement('div');
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
                document.querySelector('.success-popup')?.remove();
                popup_good.className = 'success-popup';
                popup_good.textContent = `Logged in successfully! Welcome, ${data.username}!`;                
                document.body.appendChild(popup_good);
                setTimeout(() => { popup_good.remove(); }, 6000);
                closeModal();
                isLoggedIn = true;
                loginBtn.textContent = data.username;
                if (userDropdownName) userDropdownName.textContent = data.username;
            } else {
                popup_bad.className = 'error-popup';
                popup_bad.textContent = `Logged in failed: ${data.error}`;
                document.body.appendChild(popup_bad);
                setTimeout(() => {
                    popup_bad.remove();
                }, 6000);
                closeModal();
            }
        } catch (error) {
            //JSTD-009-1
           console.error('Error:', error);
            alert(`Something went wrong: ${error}`);
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
                    popup_good.className = 'success-popup';
                    popup_good.textContent = `Registration successful! Welcome, ${data.username || username}!`;
                    document.body.appendChild(popup_good);
                    setTimeout(() => { popup_good.remove(); }, 6000);
                    closeModal();
                    btnToLogin.click();
                    e.target.reset();
            } else {
                popup_bad.className = 'error-popup';
                popup_bad.textContent = `Registration failed: ${data.error}`;
                document.body.appendChild(popup_bad);
                setTimeout(() => {
                    popup_bad.remove();
                }, 6000);
                closeModal();
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Something went wrong: ${error}`);
        }
    });
}