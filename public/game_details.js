/**
 * Opens the game details modal and fetches game data from the server.
 * @param {number|string} id - The unique identifier of the game.
 */
function openGameModal(id) {
  const modal = document.getElementById("game-details-modal");
  const body = document.getElementById("game-details-body");

  // Show loading spinner and open the modal
  body.innerHTML = `<div class="loader"></div>`;
  modal.classList.add("active");

  // Prevent background scrolling while modal is open
  document.body.style.overflow = "hidden";

  // Fetch game details from the API endpoint
  fetch(`/game/${id}`)
    .then((res) => res.json())
    .then((game) => {
      // Format the release date to a readable string, or fallback to "Unknown"
      const release = game.first_release_date
        ? new Date(game.first_release_date * 1000).toLocaleDateString()
        : "Unknown";

      // Construct the high-resolution cover image URL, or provide a placeholder
      const imageUrl = game.cover
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : "https://placehold.co/264x352?text=No%0AImage%0AFound";

      // Extract and format platforms, companies, and genres
      const platforms = game.platforms?.map((p) => p.name).join(", ") || "N/A";
      const companies =
        game.involved_companies?.map((c) => c.company.name).join(", ") || "N/A";
      const genres =
        game.genres
          ?.map(
            (g) =>
              `<span class="tag" onclick="filterGenre(${g.id}); closeGameModal();">${g.name}</span>`,
          )
          .join("") || "N/A";

      // Process screenshot URLs, limiting to a maximum of 30 images
      const screenshotUrls = game.screenshots
        ? game.screenshots
            .slice(0, 30)
            .map((s) => `https:${s.url.replace("t_thumb", "t_screenshot_big")}`)
        : [];

      // Store screenshot URLs globally for the image gallery modal
      window.currentScreenshotUrls = screenshotUrls;

      // Generate HTML for the screenshot thumbnails
      const screenshots = screenshotUrls.length
        ? screenshotUrls
            .map(
              (url, index) =>
                `<img src="${url}" alt="Screenshot ${index + 1}" class="screenshot" onclick="openImageModal(currentScreenshotUrls, ${index})">`,
            )
            .join("")
        : "";
      body.innerHTML = `
                <div class="game-modal-inner">
                    <div class="game-modal-top">
                        <img src="${imageUrl}" alt="${game.name}" crossorigin="anonymous" class="game-modal-cover">
                        <div class="game-modal-info">
                            <h2 style="margin-top:0;">${game.name}</h2>
                            <p><strong>Release:</strong> ${release}</p>
                            <p><strong>Rating:</strong> ${game.rating ? (game.rating / 10).toFixed(1) + " / 10" : "N/A"}</p>
                            <p><strong>Platforms:</strong> ${platforms}</p>
                            <p><strong>Developer:</strong> ${companies}</p>
                            <div class="tags" style="margin-top:10px;">${genres}</div>
                        </div>
                    </div>
                    <p style="margin-top: 20px; color: white; line-height: 1.6;">${game.summary || "No description available."}</p>
                    <!-- Future placeholder for external store links (Steam, GOG, Itch.io, etc.) -->
                    <div class="screenshots" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;">
                        ${screenshots}
                    </div>
                </div>
            `;
    })
    .catch(() => {
      // Handle fetch errors gracefully
      body.innerHTML = `<p style="color:red; text-align:center;">Failed to load game details.</p>`;
    });
}

/**
 * Closes the game details modal and restores background scrolling.
 */
function closeGameModal() {
  const modal = document.getElementById("game-details-modal");
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

// Initialize event listeners for the game details modal once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("close-game-details");
  const modal = document.getElementById("game-details-modal");

  // Attach click event to the close button
  if (closeBtn) closeBtn.addEventListener("click", closeGameModal);

  // Allow closing the modal by clicking on the modal backdrop
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeGameModal();
    });
  }
});

// State variables for the image gallery modal
let _screenshotUrls = [];
let _screenshotIndex = 0;

/**
 * Opens the fullscreen image gallery modal.
 * @param {string|string[]} urls - A single image URL or an array of image URLs.
 * @param {number} [startIndex=0] - The index of the image to display first.
 */
function openImageModal(urls, startIndex) {
  // Ensure urls is an array even if a single string is passed
  if (typeof urls === "string") urls = [urls];

  _screenshotUrls = urls;
  _screenshotIndex = startIndex ?? 0;

  const modal = document.getElementById("image-modal");
  if (!modal) return;

  // Render the initial screenshot and activate the modal
  _renderScreenshot();
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Renders the content of the image gallery modal and attaches its internal event listeners.
 * @private
 */
function _renderScreenshot() {
  const modal = document.getElementById("image-modal");

  // Rebuild the modal layout dynamically with the current image
  modal.innerHTML = `
        <div class="image-modal-content" style="display:flex; flex-direction:column; align-items:center;">
            <span id="close-image-modal" class="close-modal">&times;</span>
            
            <img id="modal-image" src="${_screenshotUrls[_screenshotIndex]}">
            
            <div id="screenshot-counter" style="color:white; margin-top:10px;">
                ${_screenshotIndex + 1} / ${_screenshotUrls.length}
            </div>

            <div class="modal-nav-container">
                <button id="prev-screenshot">←</button>
                <button id="next-screenshot">→</button>
            </div>
        </div>
    `;

  // Re-attach event listeners because the HTML content was overwritten
  document.getElementById("close-image-modal").onclick = closeImageModal;

  // Navigate to the previous screenshot (with wrapping)
  document.getElementById("prev-screenshot").onclick = (e) => {
    e.stopPropagation(); // Prevent modal backdrop click event from firing
    _screenshotIndex =
      (_screenshotIndex - 1 + _screenshotUrls.length) % _screenshotUrls.length;
    _renderScreenshot();
  };

  // Navigate to the next screenshot (with wrapping)
  document.getElementById("next-screenshot").onclick = (e) => {
    e.stopPropagation(); // Prevent modal backdrop click event from firing
    _screenshotIndex = (_screenshotIndex + 1) % _screenshotUrls.length;
    _renderScreenshot();
  };
}

/**
 * Closes the fullscreen image gallery modal and resets gallery state.
 */
function closeImageModal() {
  const modal = document.getElementById("image-modal");
  const img = document.getElementById("modal-image");

  // Clear image source to stop rendering
  if (img) img.src = "";
  if (modal) modal.classList.remove("active");

  // Restore page scrolling and reset state variables
  document.body.style.overflow = "auto";
  _screenshotUrls = [];
  _screenshotIndex = 0;
}

// Initialize event listeners for the image gallery modal once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("close-image-modal");
  const modal = document.getElementById("image-modal");
  const prevBtn = document.getElementById("prev-screenshot");
  const nextBtn = document.getElementById("next-screenshot");

  // Note: These listeners might be redundant as _renderScreenshot() overwrites them,
  // but they are kept as fallbacks if the initial HTML structure exists.
  if (closeBtn) closeBtn.addEventListener("click", closeImageModal);

  if (prevBtn)
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      _screenshotIndex =
        (_screenshotIndex - 1 + _screenshotUrls.length) %
        _screenshotUrls.length;
      _renderScreenshot();
    });

  if (nextBtn)
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      _screenshotIndex = (_screenshotIndex + 1) % _screenshotUrls.length;
      _renderScreenshot();
    });

  // Close the image modal when clicking outside the image content
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeImageModal();
    });
  }

  // Attach global keyboard navigation for the active image modal
  document.addEventListener("keydown", (e) => {
    const modal = document.getElementById("image-modal");

    // Ignore key presses if the image modal is not currently active
    if (!modal || !modal.classList.contains("active")) return;

    // Handle right/down arrow keys for next image
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      _screenshotIndex = (_screenshotIndex + 1) % _screenshotUrls.length;
      _renderScreenshot();
    }
    // Handle left/up arrow keys for previous image
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      _screenshotIndex =
        (_screenshotIndex - 1 + _screenshotUrls.length) %
        _screenshotUrls.length;
      _renderScreenshot();
    }
    // Handle Escape key to close the modal
    else if (e.key === "Escape") {
      closeImageModal();
    }
  });
});

/**
 * Closes the category drawer panel and triggers category filtering.
 * @param {number} id - The ID of the category/genre to filter by.
 * @param {string} [name] - The name of the category (unused in current logic but kept for interface matching).
 */
function filterByCategory(id, name) {
  const drawer = document.getElementById("category-panel");

  // Visually close the category panel
  if (drawer) drawer.classList.remove("open");

  // Execute the filter logic
  filterGenre(id);
}
