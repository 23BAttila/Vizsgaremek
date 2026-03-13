const searchBox = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const gameList = document.querySelector(".game-list");
let allFetchedGames = [];
let addFilters = [];
let blockFilters = [];
let popularityValue = 50;
let dateValue = 50;

const dateSlider = document.getElementById("date-slider");
const popularitySlider = document.getElementById("popularity-slider");

const addInput = document.querySelectorAll(".input-group input")[0];
const blockInput = document.querySelectorAll(".input-group input")[1];
const tagInputsContainer = document.querySelector(".tag-inputs");
const addTagsDisplay = document.createElement("div");
addTagsDisplay.className = "active-filter-tags";
const blockTagsDisplay = document.createElement("div");
blockTagsDisplay.className = "active-filter-tags block-tags";

document.querySelectorAll(".input-group")[0].appendChild(addTagsDisplay);
document.querySelectorAll(".input-group")[1].appendChild(blockTagsDisplay);

if (popularitySlider) {
    popularitySlider.value = 50;
    popularitySlider.addEventListener("change", () => {
        popularityValue = parseInt(popularitySlider.value);
        if (popularityValue === 50) {
            applyFilters();
            return;
        }
        const order = popularityValue > 50 ? "desc" : "asc";
        gameList.innerHTML = `<div class="loader"></div>`; 
        fetch(`/games?sortBy=rating&sortOrder=${order}`)
            .then(res => res.json())
            .then(games => {
                allFetchedGames = games;
                applyFilters();
            });
    });
}

if (dateSlider) { 
    dateSlider.value = 50;
    dateSlider.addEventListener("change", () => {
        dateValue = parseInt(dateSlider.value);
        if (dateValue === 50) {
            applyFilters();
            return;
        }
        const order = dateValue > 50 ? "desc" : "asc";
        gameList.innerHTML = `<div class="loader"></div>`; 
        fetch(`/games?sortBy=first_release_date&sortOrder=${order}`)
            .then(res => res.json())
            .then(games => {
                allFetchedGames = games;
                applyFilters();
            });
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
    addTagsDisplay.innerHTML = addFilters.map(f =>
        `<span class="filter-chip add-chip">${f} <span class="chip-remove" onclick="removeAddFilter('${f}')">×</span></span>`
    ).join("");
    blockTagsDisplay.innerHTML = blockFilters.map(f =>
        `<span class="filter-chip block-chip">${f} <span class="chip-remove" onclick="removeBlockFilter('${f}')">×</span></span>`
    ).join("");
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
    if (popularityValue !== 50) {
        const order = popularityValue > 50 ? -1 : 1;
        games.sort((a, b) => {
            const ra = a.rating ?? (order === -1 ? -1 : 9999);
            const rb = b.rating ?? (order === -1 ? -1 : 9999);
            return order * (rb - ra);
        });
    }
    if (dateValue !== 50) {
        const order = dateValue > 50 ? -1 : 1;
        games.sort((a, b) => {
            const da = a.first_release_date ?? (order === -1 ? -1 : 9999999999);
            const db = b.first_release_date ?? (order === -1 ? -1 : 9999999999);
            return order * (db - da);
        });
    }

    displayGames(games);
}

async function executeSearch() {
    const query = searchBox.value.trim();
    if (!query) return;

    gameList.innerHTML = `<div class="loader"></div>`;

    const response = await fetch(`/games?search=${encodeURIComponent(query)}`);

    if (!response.ok) {
        console.error("Error fetching games:", response.status, response.statusText);
        gameList.innerHTML = `<p style="color: white; background-color: red; border: 4px solid #ffffff; text-align: center; font-size: 28px;">Error happened while fetching...<br>Please try again later.<br>${response.status} ${response.statusText}</p>`;
        return;
    }

    allFetchedGames = await response.json();
    applyFilters();
}

searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        executeSearch();
    }
});

if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        executeSearch();
    });
}

function displayGames(games) {
    gameList.innerHTML = "";

    if (games.length === 0) {
        gameList.innerHTML = `<p style="text-align:center; color: var(--text-gray); padding: 40px;">No games match your filters.</p>`;
        return;
    }

    games.forEach(game => {
        const releaseDate = game.first_release_date
            ? new Date(game.first_release_date * 1000).toLocaleDateString()
            : "Unknown";

        const imageUrl = game.cover
            ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
            : "https://placehold.co/264x352?text=No%0AImage%0AFound";

        const safeName = game.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        gameList.innerHTML += `
            <div class="game-card">
                <img src="${imageUrl}" alt="${game.name}" class="game-img-placeholder">
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
}

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
    .catch(err => console.error("Sorry, Failed to load a genre or any genres:", err));
}

loadGenres();

function openGame(id) {
    if(typeof openGameModal === 'function') openGameModal(id);
    else window.location.href = `game.html?id=${id}`;
}

function filterGenre(id) {
    clearAllFilters();
    const drawer = document.getElementById('category-panel');
    if (drawer) drawer.classList.remove('open');
    gameList.innerHTML = `<div class="loader"></div>`;
    fetch(`/games?genre=${id}`)
    .then(res => res.json())
    .then(games => {
        allFetchedGames = games;
        applyFilters();
    });
}

function clearAllFilters() {
    addFilters = [];
    blockFilters = [];
    popularityValue = 50;
    dateValue = 50;
    if (popularitySlider) popularitySlider.value = 50;
    if (dateSlider) dateSlider.value = 50;
    renderFilterTags();
}

async function toggleFavorite(id, name, coverUrl, starElement) {
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        alert("A kedvencekhez adáshoz be kell jelentkezned!");
        document.getElementById('login-modal').classList.add('active');
        return;
    }

    const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: currentUser, 
            game: { id: id, name: name, coverUrl: coverUrl } 
        })
    });

    const data = await response.json();

    if (data.isFavorite) {
        starElement.innerHTML = '★';
        starElement.classList.add('active');
    } else {
        starElement.innerHTML = '☆';
        starElement.classList.remove('active');
    }
}

function displayFavorites(games) {
    gameList.innerHTML = `<h2 style="margin-bottom: 20px;">Mentett Kedvencek</h2>`;

    if (games.length === 0) {
        gameList.innerHTML += `<p>Még nem mentettél el egyetlen játékot sem.</p>`;
        return;
    }

    games.forEach(game => {
        const safeName = game.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        gameList.innerHTML += `
            <div class="game-card">
                <img src="${game.coverUrl}" alt="${game.name}" class="game-img-placeholder">
                <div class="game-info">
                    <h3>
                        ${game.name}
                        <span class="fav-star active" onclick="toggleFavorite(${game.id}, '${safeName}', '${game.coverUrl}', this); this.parentElement.parentElement.parentElement.remove();">★</span>
                    </h3>
                    <button class="details-btn" onclick="openGame(${game.id})" style="margin-top: 20px;">Details</button>
                </div>
            </div>
        `;
    });
}

const floatingSearchBtn = document.getElementById("floating-search-btn");

window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        floatingSearchBtn.classList.add("visible");
    } else {
        floatingSearchBtn.classList.remove("visible");
    }
});

if (floatingSearchBtn) {
    floatingSearchBtn.addEventListener("click", () => {
        document.getElementById("search-target").scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
            if (searchBox) {
                searchBox.focus();
            }
        }, 500);
    });
}