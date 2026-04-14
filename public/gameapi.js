// ==========================================
// DOM Elements & Global State Initialization
// ==========================================
const searchBox = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const gameList = document.querySelector(".game-list");

// State variables for game data and filtering
let allFetchedGames = [];
let filteredGames = [];
let addFilters = [];
let blockFilters = [];
let popularityValue = 50;
let dateValue = 50;
let currentSearchQuery = "";

let selectedPlatforms = [];
let selectedCompanies = [];

const GAMES_PER_PAGE = 20;
let currentPage = 1;

const dateSlider = document.getElementById("date-slider");
const popularitySlider = document.getElementById("popularity-slider");

const addInput = document.querySelectorAll(".input-group input")[0];
const blockInput = document.querySelectorAll(".input-group input")[1];

const addTagsDisplay = document.createElement("div");
addTagsDisplay.className = "active-filter-tags";
const blockTagsDisplay = document.createElement("div");
blockTagsDisplay.className = "active-filter-tags block-tags";

document.querySelectorAll(".input-group")[0].appendChild(addTagsDisplay);
document.querySelectorAll(".input-group")[1].appendChild(blockTagsDisplay);

const platformSelect = document.getElementById("platform-select");
const companySelect = document.getElementById("company-select");

function getAdultParam() {
  const isAdult = localStorage.getItem("isAdult");
  return isAdult === "true" ? "true" : "false";
}

function updateSliderLabels() {
  const dateGroup = dateSlider?.closest(".slider-group");
  const popGroup = popularitySlider?.closest(".slider-group");

  if (dateGroup) {
    const v = dateValue;
    let label = "Any date";
    if (v < 20) label = "Very old (pre-2000)";
    else if (v < 40) label = "Older (2000–2010)";
    else if (v < 60) label = "Any date";
    else if (v < 80) label = "Recent (2015+)";
    else label = "New (2020+)";

    let el = dateGroup.querySelector(".slider-value-label");
    if (!el) {
      el = document.createElement("div");
      el.className = "slider-value-label";
      dateGroup.appendChild(el);
    }
    el.textContent = label;
  }

  if (popGroup) {
    const v = popularityValue;
    let label = "Any";
    if (v < 20) label = "Very niche";
    else if (v < 40) label = "Niche";
    else if (v < 60) label = "Any";
    else if (v < 80) label = "Popular";
    else label = "Very popular";

    let el = popGroup.querySelector(".slider-value-label");
    if (!el) {
      el = document.createElement("div");
      el.className = "slider-value-label";
      popGroup.appendChild(el);
    }
    el.textContent = label;
  }
}

if (popularitySlider) {
  popularitySlider.value = 50;
  popularitySlider.addEventListener("input", () => {
    popularityValue = parseInt(popularitySlider.value);
    updateSliderLabels();
    applyFilters();
  });
}

if (dateSlider) {
  dateSlider.value = 50;
  dateSlider.addEventListener("input", () => {
    dateValue = parseInt(dateSlider.value);
    updateSliderLabels();
    applyFilters();
  });
}

if (platformSelect) {
  platformSelect.addEventListener("change", () => {
    selectedPlatforms = Array.from(platformSelect.selectedOptions).map(opt => parseInt(opt.value));
    applyFilters();
  });
}

if (companySelect) {
  companySelect.addEventListener("change", () => {
    selectedCompanies = Array.from(companySelect.selectedOptions).map(opt => parseInt(opt.value));
    applyFilters();
  });
}

if (addInput) {
  addInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const val = addInput.value.trim().toLowerCase();
      if (val && !addFilters.includes(val)) {
        if (blockFilters.includes(val)) {
          addInput.value = "";
          return;
        }
        addFilters.push(val);
        renderFilterTags();
        applyFilters();
      }
      addInput.value = "";
    }
  });
}

if (blockInput) {
  blockInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const val = blockInput.value.trim().toLowerCase();
      if (val && !blockFilters.includes(val)) {
        if (addFilters.includes(val)) {
          blockInput.value = "";
          return;
        }
        blockFilters.push(val);
        renderFilterTags();
        applyFilters();
      }
      blockInput.value = "";
    }
  });
}

function renderFilterTags() {
  addTagsDisplay.innerHTML = addFilters
    .map(f => `<span class="filter-chip add-chip">${f} <span class="chip-remove" onclick="removeAddFilter('${f}')">×</span></span>`)
    .join("");

  blockTagsDisplay.innerHTML = blockFilters
    .map(f => `<span class="filter-chip block-chip">${f} <span class="chip-remove" onclick="removeBlockFilter('${f}')">×</span></span>`)
    .join("");
}

function removeAddFilter(name) {
  addFilters = addFilters.filter(f => f !== name);
  renderFilterTags();
  applyFilters();
}

function removeBlockFilter(name) {
  blockFilters = blockFilters.filter(f => f !== name);
  renderFilterTags();
  applyFilters();
}

async function attachPopularity(games) {
  const ids = games.map(g => g.id);
  try {
    const res = await fetch("/api/popularity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const map = await res.json();
    games.forEach(g => {
      g.popularityScore = map[g.id] ?? (g.total_rating ? g.total_rating / 100 : 0);
    });
  } catch (e) {
    console.error("Popularity fetch failed", e);
    games.forEach(g => {
      g.popularityScore = g.total_rating ? g.total_rating / 100 : 0;
    });
  }
  return games;
}

function applyFilters() {
  let games = [...allFetchedGames];

  if (addFilters.length > 0) {
    games = games.filter(g =>
      g.genres && addFilters.every(f =>
        g.genres.some(genre => genre.name.toLowerCase().includes(f))
      )
    );
  }

  if (blockFilters.length > 0) {
    games = games.filter(g =>
      !g.genres || !blockFilters.some(f =>
        g.genres.some(genre => genre.name.toLowerCase().includes(f))
      )
    );
  }

  if (selectedPlatforms.length > 0) {
    games = games.filter(g =>
      g.platforms && selectedPlatforms.every(pid =>
        g.platforms.some(p => p === pid)
      )
    );
  }

  if (selectedCompanies.length > 0) {
    games = games.filter(g =>
      g.involved_companies && selectedCompanies.some(cid =>
        g.involved_companies.some(ic => ic.company === cid)
      )
    );
  }

  if (popularityValue !== 50 || dateValue !== 50) {
    const dateWeight = (dateValue - 50) / 50;
    const popWeight = (popularityValue - 50) / 50;

    const dates = games.map(g => g.first_release_date || 0);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const dateRange = maxDate - minDate || 1;

    const popValues = games.map(g => g.popularityScore ?? 0);
    const minPop = Math.min(...popValues);
    const maxPop = Math.max(...popValues);
    const popRange = maxPop - minPop || 1;

    games.sort((a, b) => {
      const dateA = a.first_release_date || 0;
      const dateB = b.first_release_date || 0;
      const popA = a.popularityScore ?? 0;
      const popB = b.popularityScore ?? 0;

      const normDateA = (dateA - minDate) / dateRange;
      const normDateB = (dateB - minDate) / dateRange;
      const normPopA = (popA - minPop) / popRange;
      const normPopB = (popB - minPop) / popRange;

      const scoreA = dateWeight * normDateA + popWeight * normPopA;
      const scoreB = dateWeight * normDateB + popWeight * normPopB;

      return scoreB - scoreA;
    });
  }

  filteredGames = games;
  currentPage = 1;
  renderPage();
}

function renderPage() {
  gameList.innerHTML = "";

  if (filteredGames.length === 0) {
    gameList.innerHTML = `<p style="text-align:center; color: var(--text-gray); padding: 40px;">No games match your filters.</p>`;
    return;
  }

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const start = (currentPage - 1) * GAMES_PER_PAGE;
  const pageGames = filteredGames.slice(start, start + GAMES_PER_PAGE);

  pageGames.forEach(game => {
    const releaseDate = game.first_release_date
      ? new Date(game.first_release_date * 1000).toLocaleDateString()
      : "Unknown";

    const imageUrl = game.cover
      ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
      : "https://placehold.co/264x352?text=No%0AImage%0AFound";

    const safeName = game.name.replace(/'/g, "\\'").replace(/"/g, "&quot;");

    gameList.innerHTML += `
      <div class="game-card">
        <img src="${imageUrl}" alt="${game.name}" class="game-img-placeholder" crossorigin="anonymous">
        <div class="game-info">
          <h3>
            ${game.name}
            <span class="fav-star" onclick="toggleFavorite(${game.id}, '${safeName}', '${imageUrl}', this)">☆</span>
          </h3>
          <p class="release-date">Release date: ${releaseDate}</p>
          <div class="tags">
            ${game.genres ? game.genres.map(g => `<span class="tag" onclick="filterGenre(${g.id})">${g.name}</span>`).join("") : ""}
          </div>
          <button class="details-btn" onclick="openGame(${game.id})">Details</button>
        </div>
      </div>
    `;
  });

  if (totalPages > 1) {
    let paginationHTML = `<div class="pagination">`;
    paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>&#8249;</button>`;
    if (currentPage > 3) {
      paginationHTML += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
      if (currentPage > 4) paginationHTML += `<span class="page-ellipsis">…</span>`;
    }
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      paginationHTML += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="goToPage(${i})">${i}</button>`;
    }
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) paginationHTML += `<span class="page-ellipsis">…</span>`;
      paginationHTML += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>&#8250;</button>`;
    paginationHTML += `</div>`;
    gameList.innerHTML += paginationHTML;
  }

  setTimeout(applyCardGradients, 100);
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderPage();
  document.querySelector(".gamehunt-logo").scrollIntoView();
}

function displayGames(games) {
  allFetchedGames = games;
  applyFilters();
  setTimeout(() => observeCards(), 1000);
}

async function executeSearch() {
  const query = searchBox.value.trim();
  if (!query) return;

  currentSearchQuery = query;
  gameList.innerHTML = `<div class="loader"></div>`;

  const adultParam = getAdultParam();
  const response = await fetch(`/games?search=${encodeURIComponent(query)}&adult=${adultParam}`);
  if (!response.ok) {
    gameList.innerHTML = `<p style="color: white; background-color: red; border: 4px solid #ffffff; text-align: center; font-size: 28px;">Error happened while fetching...<br>Please try again later.<br>${response.status} ${response.statusText}</p>`;
    return;
  }

  allFetchedGames = await response.json();
  allFetchedGames = await attachPopularity(allFetchedGames);
  observeCards();
  applyFilters();
}

searchBox.addEventListener("keypress", e => { if (e.key === "Enter") executeSearch(); });
if (searchBtn) searchBtn.addEventListener("click", executeSearch);

function loadGenres() {
  fetch("/genres")
    .then(res => res.json())
    .then(genres => {
      const categoryList = document.querySelector(".category-list");
      categoryList.innerHTML = "";
      genres.sort((a, b) => a.name.localeCompare(b.name));
      genres.forEach(genre => {
        const span = document.createElement("span");
        span.className = "category-tag";
        span.textContent = genre.name;
        span.onclick = () => filterByCategory(genre.id, genre.name);
        categoryList.appendChild(span);
      });
    })
    .catch(err => console.error("Failed to load genres:", err));
}

async function loadPlatforms() {
  try {
    const res = await fetch("/platforms");
    const platforms = await res.json();
    const select = document.getElementById("platform-select");
    select.innerHTML = '<option value="">All Platforms</option>';
    platforms.sort((a, b) => a.name.localeCompare(b.name));
    platforms.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      select.appendChild(option);
    });
  } catch (e) {
    console.error("Failed to load platforms", e);
  }
}

async function loadCompanies() {
  try {
    const res = await fetch("/companies");
    const companies = await res.json();
    const select = document.getElementById("company-select");
    select.innerHTML = '<option value="">All Companies</option>';
    companies.sort((a, b) => a.name.localeCompare(b.name));
    companies.forEach(c => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = c.name;
      select.appendChild(option);
    });
  } catch (e) {
    console.error("Failed to load companies", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadGenres();
  loadPlatforms();
  loadCompanies();
  updateSliderLabels();
});

function openGame(id) {
  if (typeof openGameModal === "function") openGameModal(id);
  else window.location.href = `game.html?id=${id}`;
}

function filterGenre(id) {
  addFilters = [];
  blockFilters = [];
  renderFilterTags();

  const drawer = document.getElementById("category-panel");
  if (drawer) drawer.classList.remove("open");

  gameList.innerHTML = `<div class="loader"></div>`;

  let url = `/games?genre=${id}&adult=${getAdultParam()}`;
  if (currentSearchQuery) {
    url += `&search=${encodeURIComponent(currentSearchQuery)}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(async games => {
      allFetchedGames = await attachPopularity(games);
      applyFilters();
    });
}

function clearAllFilters() {
  addFilters = [];
  blockFilters = [];
  popularityValue = 50;
  dateValue = 50;
  currentSearchQuery = "";
  selectedPlatforms = [];
  selectedCompanies = [];
  if (popularitySlider) popularitySlider.value = 50;
  if (dateSlider) dateSlider.value = 50;
  if (platformSelect) platformSelect.value = "";
  if (companySelect) companySelect.value = "";
  renderFilterTags();
}

async function toggleFavorite(id, name, coverUrl, starElement) {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    document.getElementById("login-modal").classList.add("active");
    return;
  }
  const response = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser, game: { id, name, coverUrl } }),
  });
  const data = await response.json();
  if (data.isFavorite) {
    starElement.innerHTML = "★";
    starElement.classList.add("active");
  } else {
    starElement.innerHTML = "☆";
    starElement.classList.remove("active");
  }
}

function displayFavorites(games) {
  gameList.innerHTML = `<h2 style="margin-bottom: 20px;">Saved Favourites</h2>`;
  if (games.length === 0) {
    gameList.innerHTML += `<p>You haven't saved any games so far.</p><br><p>Click on the start on the top right of a game card.</p>`;
    return;
  }
  games.forEach(game => {
    const safeName = game.name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="game-card">
        <img src="${game.coverUrl}" crossorigin="anonymous" alt="${game.name}" class="game-img-placeholder">
        <div class="game-info">
          <h3>${game.name}
            <span class="fav-star active" onclick="toggleFavorite(${game.id}, '${safeName}', '${game.coverUrl}', this); this.parentElement.parentElement.parentElement.remove();">★</span>
          </h3>
          <button class="details-btn" onclick="openGame(${game.id})" style="margin-top: 20px;">Details</button>
        </div>
      </div>
    `;
    gameList.appendChild(wrapper.firstElementChild);
  });
  setTimeout(() => applyCardGradients(), 50);
}

gameList.innerHTML = `<div class="loader"></div>`;
fetch(`/games/popular?adult=${getAdultParam()}`)
  .then(res => res.json())
  .then(async games => {
    allFetchedGames = await attachPopularity(games);
    applyFilters();
  })
  .catch(() => {
    gameList.innerHTML = `<p style="text-align:center; color: var(--text-gray); padding: 40px;">Looks like there is no popular game here...</p>`;
  });

// ==========================================
// Scroll & Animation Utilities
// ==========================================
let lastScrollY = window.scrollY;
const searchInput = document.getElementById("search-target");

window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;
  const scrollingUp = currentScrollY < lastScrollY;
  if (scrollingUp && currentScrollY > 300) {
    searchInput.classList.add("visible");
  } else {
    searchInput.classList.remove("visible");
  }
  lastScrollY = currentScrollY;
});

if (searchInput) {
  searchInput.addEventListener("click", () => {
    document.getElementById("search-target").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => searchBox?.focus(), 500);
  });
}

function applyCardGradients() {
  const colorThief = new ColorThief();
  document.querySelectorAll(".game-card").forEach(card => {
    const img = card.querySelector("img");
    if (!img) return;

    const isGrayscale = ([r, g, b], tol = 15) =>
      Math.abs(r - g) < tol && Math.abs(r - b) < tol && Math.abs(g - b) < tol;
    const getSaturation = ([r, g, b]) => {
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      return max === 0 ? 0 : (max - min) / max;
    };
    const getBrightness = ([r, g, b]) => (r + g + b) / 2;

    const applyColor = () => {
      try {
        const palette = colorThief.getPalette(img, 8);
        let chosen = palette.filter(c => !isGrayscale(c)).sort((a, b) => {
          const satDiff = getSaturation(b) - getSaturation(a);
          return Math.abs(satDiff) > 0.05 ? satDiff : getBrightness(b) - getBrightness(a);
        })[0] || palette[0];
        const [r, g, b] = chosen;
        card.style.setProperty("--glow-color", `rgb(${r},${g},${b})`);
        card.style.borderBottomColor = `rgb(${r},${g},${b})`;
      } catch (e) {}
    };

    if (img.complete && img.naturalWidth > 0) applyColor();
    else img.addEventListener("load", applyColor, { once: true });
  });
}

function observeCards() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle("visible", entry.isIntersecting);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".game-card").forEach(card => {
    card.classList.add("game-card-reveal");
    observer.observe(card);
  });
}