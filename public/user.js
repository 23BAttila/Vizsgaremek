/**
 * ============================================================================
 * GAMEHUNT - USER INTERACTION & AUTHENTICATION SCRIPT
 * ============================================================================
 */

/* ==========================================================================
   1. DOM ELEMENTS & STATE VARIABLES
   ========================================================================== */

// Category Drawer Elements
const drawer = document.getElementById("category-panel");
const openBtn = document.getElementById("open-categories");
const closeBtnDrawer = document.getElementById("close-drawer");

// Login & User Profile Elements
const loginBtn = document.querySelector(".login-btn-fixed");
const loginModal = document.getElementById("login-modal");
const closeLoginBtn = document.getElementById("close-login");
const userDropdown = document.getElementById("user-dropdown");
const userDropdownName = document.getElementById("user-dropdown-name");
const dropdownLogout = document.getElementById("dropdown-logout");
const mobileProfileBtn = document.querySelector(".mobile-profile-toggle");

// Authentication Form Elements
const loginFormContainer = document.getElementById("login-form-container");
const registerFormContainer = document.getElementById("register-form-container");
const btnToRegister = document.getElementById("btn-to-register");
const btnToLogin = document.getElementById("btn-to-login");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

// Feature Elements
const favoritesLink = document.getElementById("favorites-link");

// Global Application State
let isLoggedIn = false;

/* ==========================================================================
   2. UTILITY FUNCTIONS
   ========================================================================== */

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = type === "success" ? "success-popup" : "error-popup";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function updateUIForLoggedInUser(username) {
  isLoggedIn = true;
  if (loginBtn) {
    loginBtn.style.display = "block";
    loginBtn.textContent = username;
  }
  if (userDropdownName) {
    userDropdownName.textContent = username;
  }

  try {
    const response = await fetch(`/api/admin/level/${username}`);
    if (response.ok) {
      const data = await response.json();
      if (data.isAdmin) {
        addAdminPanelButton(data.adminLevel);
      }
    }
  } catch (err) {
    console.error("Failed to check admin status:", err);
  }
}

function addAdminPanelButton(adminLevel) {
  const dropdown = document.getElementById("user-dropdown");
  const logoutBtn = document.getElementById("dropdown-logout");
  if (!dropdown || !logoutBtn) return;

  const existing = document.getElementById("admin-panel-btn");
  if (existing) existing.remove();

  if (!document.querySelector(".admin-divider")) {
    const divider = document.createElement("hr");
    divider.className = "user-dropdown-divider admin-divider";
    dropdown.insertBefore(divider, logoutBtn);
  }

  const adminBtn = document.createElement("button");
  adminBtn.id = "admin-panel-btn";
  adminBtn.className = "user-dropdown-item";
  adminBtn.textContent = `Admin Panel (Lvl ${adminLevel})`;
  adminBtn.addEventListener("click", () => {
    if (typeof openAdminModal === "function") {
      openAdminModal();
    }
    dropdown.style.display = "none";
  });
  dropdown.insertBefore(adminBtn, logoutBtn);
}

/* ==========================================================================
   3. INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    updateUIForLoggedInUser(currentUser);
  }
});

/* ==========================================================================
   4. EVENT LISTENERS
   ========================================================================== */

if (openBtn && drawer && closeBtnDrawer) {
  openBtn.addEventListener("click", () => drawer.classList.add("open"));
  closeBtnDrawer.addEventListener("click", () => drawer.classList.remove("open"));
}

if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isLoggedIn) {
      userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
    } else {
      loginModal.classList.add("active");
    }
  });
}

if (mobileProfileBtn) {
  mobileProfileBtn.addEventListener("click", () => {
    if (!isLoggedIn) {
      loginModal.classList.add("active");
    } else {
      userDropdown.classList.toggle("active");
    }
  });
}

document.addEventListener("click", () => {
  if (userDropdown) userDropdown.style.display = "none";
});

if (closeLoginBtn) {
  closeLoginBtn.addEventListener("click", () => loginModal.classList.remove("active"));
}

if (btnToRegister) {
  btnToRegister.addEventListener("click", () => {
    loginFormContainer.style.display = "none";
    registerFormContainer.style.display = "block";
  });
}

if (btnToLogin) {
  btnToLogin.addEventListener("click", () => {
    registerFormContainer.style.display = "none";
    loginFormContainer.style.display = "block";
  });
}

/* ==========================================================================
   5. API & FORM HANDLING
   ========================================================================== */

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      email: e.target.querySelector('input[type="email"]').value.trim(),
      username: e.target.querySelector('input[type="text"]').value.trim(),
      password: e.target.querySelector('input[type="password"]').value.trim(),
      birthdate: document.getElementById("register-birthdate").value
    };

    if (!data.email || !data.username || !data.password || !data.birthdate) {
      showToast("All fields are required!", "error");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showToast("Registration successful! Please log in.", "success");
        e.target.reset();
        document.getElementById("register-birthdate").value = "";
          btnToLogin.click();
      } else {
        showToast(result.error || "Registration failed!", "error");
      }
    } catch (error) {
      console.log(error)
      showToast("Server error. Please try again.", "error");
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");

    const data = {
      username: inputs[0].value.trim(),
      password: inputs[1].value.trim(),
    };

    if (!data.username || !data.password) {
      showToast("Username and password are required.", "error");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("currentUser", result.username);
        localStorage.setItem("isAdult", result.isAdult);
        updateUIForLoggedInUser(result.username);
        loginModal.classList.remove("active");
        showToast(`Welcome, ${result.username}!`);
        e.target.reset();
      } else {
        showToast(result.error || "Invalid username or password.", "error");
      }
    } catch (error) {
      showToast("Server error. Please try again.", "error");
    }
  });
}

/* ==========================================================================
   6. USER FEATURES
   ========================================================================== */

if (favoritesLink) {
  favoritesLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      showToast("Please log in!", "error");
      loginModal.classList.add("active");
      return;
    }
    try {
      const response = await fetch(`/api/favorites/${currentUser}`);
      const favGames = await response.json();
      if (typeof displayFavorites === "function") {
        displayFavorites(favGames);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  });
}

if (dropdownLogout) {
  dropdownLogout.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("username");
    localStorage.removeItem("isAdult");
    // location.reload();
    window.location.href = "/index.html";
  });
}

// Make addAdminPanelButton globally accessible
window.addAdminPanelButton = addAdminPanelButton;