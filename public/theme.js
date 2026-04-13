/**
 * ============================================================================
 * GAMEHUNT - THEME MANAGEMENT SCRIPT
 * Handles switching between Light and Dark modes and persists user preference.
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // --- UI Element Selectors ---
  const toggleBtn = document.getElementById("theme-toggle-btn");
  const searchInput = document.getElementById("search-input");
  const iconLight = document.getElementById("search-icon-light");
  const iconDark = document.getElementById("search-icon-dark");

  /**
   * Updates the application's theme and swaps relevant icons.
   * @param {string} theme - The target theme ('dark' or 'light').
   */
  function setTheme(theme) {
    // Elements to update during theme change
    const lightModeIcon = document.getElementById("light-mode-icon");
    const darkModeIcon = document.getElementById("dark-mode-icon");
    const searchIconLight = document.getElementById("search-icon-light");
    const searchIconDark = document.getElementById("search-icon-dark");

    if (theme === "dark") {
      // Apply Dark Theme
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");

      // Update Header Icons (Visibility toggle)
      if (lightModeIcon) lightModeIcon.style.display = "none";
      if (darkModeIcon) darkModeIcon.style.display = "inline";

      // Update Search Icons
      if (searchIconLight) searchIconLight.style.display = "inline";
      if (searchIconDark) searchIconDark.style.display = "none";
    } else {
      // Apply Light Theme
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");

      // Update Header Icons (Visibility toggle)
      if (lightModeIcon) lightModeIcon.style.display = "inline";
      if (darkModeIcon) darkModeIcon.style.display = "none";

      // Update Search Icons
      if (searchIconLight) searchIconLight.style.display = "none";
      if (searchIconDark) searchIconDark.style.display = "inline";
    }

    // Save selection to Local Storage for persistence across sessions
    localStorage.setItem("theme", theme);
  }

  // --- Click Event for Theme Toggle Button ---
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      // Check current state and toggle to the opposite
      const isDark = document.body.classList.contains("dark-theme");
      setTheme(isDark ? "light" : "dark");
    });
  }

  // --- Initialization ---
  // Load saved theme from storage, default to 'dark' if no preference exists
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);

  // --- Search Input Icon Handling ---
  // Dynamically changes search icons when the user focuses on the search bar
  if (searchInput && iconLight && iconDark) {
    searchInput.addEventListener("focus", () => {
      // Force dark icon visibility on focus for better contrast
      iconLight.style.display = "none";
      iconDark.style.display = "inline";
    });

    searchInput.addEventListener("blur", () => {
      // Revert to the active theme's icon when focus is lost
      const currentTheme = localStorage.getItem("theme") || "dark";
      setTheme(currentTheme);
    });
  }
});
