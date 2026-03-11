function openGameModal(id) {
    const modal = document.getElementById('game-details-modal');
    const body = document.getElementById('game-details-body');
    body.innerHTML = `<div class="loader"></div>`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    fetch(`/game/${id}`)
        .then(res => res.json())
        .then(game => {
            const release = game.first_release_date
                ? new Date(game.first_release_date * 1000).toLocaleDateString()
                : "Unknown";

            const imageUrl = game.cover
                ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
                : "https://placehold.co/264x352?text=No%0AImage%0AFound";

            const platforms = game.platforms?.map(p => p.name).join(", ") || "N/A";
            const companies = game.involved_companies?.map(c => c.company.name).join(", ") || "N/A";
            const genres = game.genres?.map(g => `<span class="tag" onclick="filterGenre(${g.id}); closeGameModal();">${g.name}</span>`).join("") || "N/A";

            const screenshotUrls = game.screenshots
                ? game.screenshots.slice(0, 10).map(s => `https:${s.url.replace("t_thumb", "t_screenshot_big")}`)
                : [];
            window.currentScreenshotUrls = screenshotUrls;

            const screenshots = screenshotUrls.length
                ? screenshotUrls.map((url, index) =>
                    `<img src="${url}" alt="Screenshot ${index + 1}" class="screenshot" onclick="openImageModal(currentScreenshotUrls, ${index})">`
                  ).join("")
                : "";
            

            body.innerHTML = `
                <div class="game-modal-inner">
                    <div class="game-modal-top">
                        <img src="${imageUrl}" alt="${game.name}" class="game-modal-cover">
                        <div class="game-modal-info">
                            <h2 style="margin-top:0;">${game.name}</h2>
                            <p><strong>Release:</strong> ${release}</p>
                            <p><strong>Rating:</strong> ${game.rating ? (game.rating / 10).toFixed(1) + " / 10" : "N/A"}</p>
                            <p><strong>Platforms:</strong> ${platforms}</p>
                            <p><strong>Developer:</strong> ${companies}</p>
                            <div class="tags" style="margin-top:10px;">${genres}</div>
                        </div>
                    </div>
                    <p style="margin-top: 20px; color: var(--text-gray); line-height: 1.6;">${game.summary || "No description available."}</p>
                    <!-ide kell majd a steam, gog, itch, stb.-->
                    <div class="screenshots" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;">
                        ${screenshots}
                    </div>
                </div>
            `;
        })
        .catch(() => {
            body.innerHTML = `<p style="color:red; text-align:center;">Failed to load game details.</p>`;
        });
}

function closeGameModal() {
    const modal = document.getElementById('game-details-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-game-details');
    const modal = document.getElementById('game-details-modal');

    if (closeBtn) closeBtn.addEventListener('click', closeGameModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeGameModal();
        });
    }
});
let _screenshotUrls = [];
let _screenshotIndex = 0;

function openImageModal(urls, startIndex) {
    if (typeof urls === 'string') urls = [urls];
    _screenshotUrls = urls;
    _screenshotIndex = startIndex ?? 0;

    const modal = document.getElementById('image-modal');
    if (!modal) return;
    _renderScreenshot();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function _renderScreenshot() {
    const img = document.getElementById('modal-image');
    const counter = document.getElementById('screenshot-counter');
    const prevBtn = document.getElementById('prev-screenshot');
    const nextBtn = document.getElementById('next-screenshot');

    if (img) img.src = _screenshotUrls[_screenshotIndex];
    if (counter) {
        counter.textContent = _screenshotUrls.length > 1
            ? `${_screenshotIndex + 1} / ${_screenshotUrls.length}`
            : '';
    }
    if (prevBtn) prevBtn.style.visibility = _screenshotUrls.length > 1 ? 'visible' : 'hidden';
    if (nextBtn) nextBtn.style.visibility = _screenshotUrls.length > 1 ? 'visible' : 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-image');
    if (img) img.src = "";
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    _screenshotUrls = [];
    _screenshotIndex = 0;
}


document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-image-modal');
    const modal = document.getElementById('image-modal');
    const prevBtn = document.getElementById('prev-screenshot');
    const nextBtn = document.getElementById('next-screenshot');

    if (closeBtn) closeBtn.addEventListener('click', closeImageModal);

    if (prevBtn) prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _screenshotIndex = (_screenshotIndex - 1 + _screenshotUrls.length) % _screenshotUrls.length;
        _renderScreenshot();
    });

    if (nextBtn) nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _screenshotIndex = (_screenshotIndex + 1) % _screenshotUrls.length;
        _renderScreenshot();
    });

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeImageModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('image-modal');
        if (!modal || !modal.classList.contains('active')) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            _screenshotIndex = (_screenshotIndex + 1) % _screenshotUrls.length;
            _renderScreenshot();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            _screenshotIndex = (_screenshotIndex - 1 + _screenshotUrls.length) % _screenshotUrls.length;
            _renderScreenshot();
        } else if (e.key === 'Escape') {
            closeImageModal();
        }
    });
});
function filterByCategory(id, name) {
    const drawer = document.getElementById('category-panel');
    if (drawer) drawer.classList.remove('open');
    filterGenre(id);
}