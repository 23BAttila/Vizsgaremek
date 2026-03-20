document.addEventListener("DOMContentLoaded", function() {
    const toggleBtn = document.getElementById("theme-toggle-btn");

    function setTheme(theme) {
        if (theme === "dark") {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
            document.getElementById("light-mode-icon").style.display = "none";
            document.getElementById("dark-mode-icon").style.display = "inline";
            document.getElementById("search-icon-light").style.display = "inline";
            document.getElementById("search-icon-dark").style.display = "none";
        } else {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
            document.getElementById("light-mode-icon").style.display = "inline";
            document.getElementById("dark-mode-icon").style.display = "none";
            document.getElementById("search-icon-light").style.display = "none";
            document.getElementById("search-icon-dark").style.display = "inline";
        }
        localStorage.setItem("theme", theme);
    }

    toggleBtn.addEventListener("click", function() {
        const isDark = document.body.classList.contains("dark-theme");
        setTheme(isDark ? "light" : "dark");
    });

    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    const searchInput = document.getElementById("search-input");
    const iconLight = document.getElementById("search-icon-light");
    const iconDark = document.getElementById("search-icon-dark");

    if (searchInput && iconLight && iconDark) {
        searchInput.addEventListener("focus", () => {
            iconLight.style.display = "none";
            iconDark.style.display = "inline";
        });
        searchInput.addEventListener("blur", () => {
            setTheme(localStorage.getItem("theme") || "dark");
        });
    }
});