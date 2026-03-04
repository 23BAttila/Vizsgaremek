const searchBox = document.querySelector(".search-box");
const gameList = document.querySelector(".game-list");

searchBox.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
        const query = searchBox.value;

        const response = await fetch(`/games?search=${encodeURIComponent(query)}`);

        const games = await response.json();
        //TRELLO(JSTD-001-2)
        if (!response.ok) {
            alert(`Error happened while fetching...  ${response.status} ${response.statusText} `);
            console.error("Error fetching games:", response.status, response.statusText);
            //TRELLO(JSTD-006-1)(.=>css) 
            gameList.innerHTML = `<p style="color: white; background-color: red; border: 4px solid #ffffff; text-align: center; font-size: 28px;">Error happened while fetching...</br>Please try again later.</br> ${response.status} ${response.statusText}</p>` ;
            return;
        }
        displayGames(games);
    }
});
//TRELLO(JSTD-004-3)
function displayGames(games) {
    gameList.innerHTML = "";

    games.forEach(game => {
        const releaseDate = game.first_release_date
            ? new Date(game.first_release_date * 1000).toLocaleDateString() 
            : "Unknown";

        const imageUrl = game.cover
            ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
            : "https://placehold.co/264x352?text=No%0AImage%0AFound"; 


        gameList.innerHTML += `
            <div class="game-card">
                <img src="${imageUrl}" alt="${game.name}">
                <div class="game-info">
                    <h3>${game.name}</h3>
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
function openGame(id) {
    window.location.href = `game.html?id=${id}`;
}
function filterGenre(id) {
    fetch(`/games?genre=${id}`)
        .then(res => res.json())
        .then(displayGames);
}

