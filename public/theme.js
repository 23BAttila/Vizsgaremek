document.addEventListener("DOMContentLoaded", function() {
    const toggleBtn = document.getElementById("theme-toggle-btn");

    function setTheme(theme) {
        if (theme === "dark") {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
            document.getElementById("light-mode-icon").style.display = "none";
            document.getElementById("dark-mode-icon").style.display = "inline";
        } else {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
            document.getElementById("light-mode-icon").style.display = "inline";
            document.getElementById("dark-mode-icon").style.display = "none";
        }
        localStorage.setItem("theme", theme);
    }

    toggleBtn.addEventListener("click", function() {
        const isDark = document.body.classList.contains("dark-theme");
        setTheme(isDark ? "light" : "dark");
    });

    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
});