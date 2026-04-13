/**
 * ============================================================================
 * GAMEHUNT - USER INTERACTION & AUTHENTICATION SCRIPT
 * * Table of Contents:
 * 1. DOM Elements & State Variables
 * 2. Utility Functions (Toasts, UI Updates)
 * 3. Initialization
 * 4. Event Listeners (Modals, Navigation, Toggles)
 * 5. API & Form Handling (Login & Register)
 * 6. User Features (Favorites, Logout)
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
const registerFormContainer = document.getElementById(
  "register-form-container",
);
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

/**
 * Displays a temporary popup message (toast) on the screen.
 * @param {string} message - The message to display.
 * @param {string} type - The type of toast ('success' or 'error').
 */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = type === "success" ? "success-popup" : "error-popup";
  toast.textContent = message;

  document.body.appendChild(toast);

  // Automatically remove the toast after 4 seconds
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

/**
 * Updates the user interface based on the logged-in user's data.
 * @param {string} username - The logged-in user's username.
 */
function updateUIForLoggedInUser(username) {
  isLoggedIn = true;

  // Update main login button to show username
  if (loginBtn) {
    loginBtn.style.display = "block";
    loginBtn.textContent = username;
  }

  // Update dropdown header with username
  if (userDropdownName) {
    userDropdownName.textContent = username;
  }
}

/**
 * Alternative/Legacy UI updater for login state.
 * Syncs the UI with the 'username' key in localStorage.
 */
function updateLoginState() {
  const mainLoginBtn = document.getElementById("login-btn");
  const userMenu = document.getElementById("user-menu");
  const username = localStorage.getItem("username");

  console.log("Current username in storage:", username); // Debugging output

  if (username && username !== "undefined") {
    // User is logged in
    mainLoginBtn.innerHTML = `${username}`;
    mainLoginBtn.style.display = "block";

    // Toggle user menu on click
    mainLoginBtn.onclick = (e) => {
      e.stopPropagation();
      userMenu.style.display =
        userMenu.style.display === "block" ? "none" : "block";
    };
  } else {
    // User is not logged in
    mainLoginBtn.textContent = "Bejelentkezés";
    mainLoginBtn.onclick = () => {
      document.getElementById("modal-overlay").style.display = "flex";
      document.getElementById("login-modal").style.display = "block";
    };
  }
}

/* ==========================================================================
   3. INITIALIZATION
   ========================================================================== */

// Check authentication state as soon as the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    updateUIForLoggedInUser(currentUser);
  }
});

/* ==========================================================================
   4. EVENT LISTENERS
   ========================================================================== */

// --- Category Drawer Navigation ---
if (openBtn && drawer && closeBtnDrawer) {
  openBtn.addEventListener("click", () => drawer.classList.add("open"));
  closeBtnDrawer.addEventListener("click", () =>
    drawer.classList.remove("open"),
  );
}

// --- Main Login/Profile Button (Desktop) ---
if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent the global click listener from closing the dropdown immediately

    if (isLoggedIn) {
      // Toggle dropdown if user is logged in
      if (userDropdown.style.display === "block") {
        userDropdown.style.display = "none";
      } else {
        userDropdown.style.display = "block";
      }
    } else {
      // Open login modal if user is not logged in
      loginModal.classList.add("active");
    }
  });
}

// --- Mobile Profile Button ---
if (mobileProfileBtn) {
  mobileProfileBtn.addEventListener("click", () => {
    if (!isLoggedIn) {
      loginModal.classList.add("active");
    } else {
      userDropdown.classList.toggle("active");
    }
  });
}

// --- Global Click Listener ---
// Closes the user dropdown if the user clicks anywhere else on the page
document.addEventListener("click", () => {
  if (userDropdown) {
    userDropdown.style.display = "none";
  }
});

// --- Modal Close Button ---
if (closeLoginBtn) {
  closeLoginBtn.addEventListener("click", () => {
    loginModal.classList.remove("active");
  });
}

// --- Switch Between Login and Register Forms ---
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

// --- Login Form Submission ---
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");

    const data = {
      username: inputs[0].value.trim(),
      password: inputs[1].value.trim(),
    };

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Successful login
        localStorage.setItem("currentUser", result.username);
        updateUIForLoggedInUser(result.username);
        loginModal.classList.remove("active");
        showToast(`Welcome, ${result.username}!`);
        e.target.reset();
      } else {
        // Handle login errors
        showToast(result.error || "Login failed!", "error");
      }
    } catch (error) {
      showToast("Server error!", "error");
    }
  });
}

// --- Register Form Submission ---
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");

    const data = {
      email: inputs[0].value.trim(),
      username: inputs[1].value.trim(),
      password: inputs[2].value.trim(),
    };

    // Basic validation
    if (!data.email || !data.username || !data.password) {
      showToast("Missing fields!", "error");
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
        // Successful registration
        showToast("Success! Please login.", "success");
        e.target.reset();
        btnToLogin.click(); // Switch view back to login form
      } else {
        // Handle registration errors
        showToast(result.error || "Registration failed!", "error");
      }
    } catch (error) {
      showToast("Server error!", "error");
    }
  });
}

/* ==========================================================================
   6. USER FEATURES
   ========================================================================== */

// --- Fetch & Display Favorites ---
if (favoritesLink) {
  favoritesLink.addEventListener("click", async (e) => {
    e.preventDefault();

    const currentUser = localStorage.getItem("currentUser");

    // Ensure user is logged in before fetching favorites
    if (!currentUser) {
      showToast("Please log in!", "error");
      loginModal.classList.add("active");
      return;
    }

    try {
      const response = await fetch(`/api/favorites/${currentUser}`);
      const favGames = await response.json();

      // Call external function if it exists on the page
      if (typeof displayFavorites === "function") {
        displayFavorites(favGames);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  });
}

// --- Logout Functionality ---
if (dropdownLogout) {
  dropdownLogout.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("username"); // Clear potential legacy keys
    location.reload(); // Refresh the page to reset state
  });
}
