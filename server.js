require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "public", "index.html")); });
const users = [];
app.post("/api/register", (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return res.status(400).json({ error: "All fields are required!" });
    const userExists = users.find(u => u.username === username || u.email === email);
    if (userExists) return res.status(400).json({ error: "This username or email is already taken!" });
    users.push({ email, username, password, favorites: [] }); 
    res.status(201).json({ message: "Registration successful!" });
});
app.post("/api/login", (req, res) => {
    const { identifier, password } = req.body;
    const user = users.find(u => (u.username === identifier || u.email === identifier) && u.password === password);
    if (!user) return res.status(401).json({ error: "Invalid username/email or password!" });
    res.json({ message: "Logged in successfully!", username: user.username });
});
app.get("/api/favorites/:username", (req, res) => {
    const user = users.find(u => u.username === req.params.username);
    if (!user) return res.status(404).json({ error: "User not found!" });
    res.json(user.favorites);
});
app.post("/api/favorites", (req, res) => {
    const { username, game } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: "Not logged in!" });
    const existingIndex = users.find(u => u.username === username).favorites.findIndex(f => f.id === game.id);
    if (existingIndex > -1) {
        users.find(u => u.username === username).favorites.splice(existingIndex, 1);
        res.json({ message: "Removed from favorites", isFavorite: false });
    } else {
        users.find(u => u.username === username).favorites.push(game);
        res.json({ message: "Added to favorites", isFavorite: true });
    }
});
let accessToken = "";
async function getAccessToken() {
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, { method: "POST" });
    const data = await response.json();
    accessToken = data.access_token;
}
app.get("/games/popular", async (req, res) => {
    try {
        if (!accessToken) await getAccessToken();
        const twoYearsAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365 * 2;
        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: { "Client-ID": CLIENT_ID, "Authorization": `Bearer ${accessToken}`, "Content-Type": "text/plain" },
            body: `fields name,summary,first_release_date,genres.name,rating,cover.url; where rating != null & rating_count > 10 & first_release_date > ${twoYearsAgo}; sort rating_count desc; limit 500;`
        });
        const data = await response.json();
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: "Error" }); }
});
app.get("/games", async (req, res) => {
    try {
        if (!accessToken) await getAccessToken();
        const search = req.query.search || "";
        const genre = req.query.genre || "";
        const sortBy = req.query.sortBy || "";
        const sortOrder = req.query.sortOrder || "desc";
        const conditions = [];
        if (genre) conditions.push(`genres = (${genre})`);
        if (sortBy === "rating") conditions.push("rating != null");
        if (sortBy === "first_release_date") conditions.push("first_release_date != null");
        const finalWhere = conditions.length ? `where ${conditions.join(" & ")};` : "";
        const sortClause = sortBy ? `sort ${sortBy} ${sortOrder};` : "";
        const searchClause = search && !sortBy ? `search "${search}";` : "";
        if (search && sortBy) finalWhere ? conditions.push(`name ~ *"${search}"*`) : `where name ~ *"${search}"*;`;
        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: { "Client-ID": CLIENT_ID, "Authorization": `Bearer ${accessToken}`, "Content-Type": "text/plain" },
            body: `${searchClause} ${finalWhere} ${sortClause} fields name,summary,first_release_date,genres.name,rating,cover.url; limit 500;`
        });
        const data = await response.json();
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: "Error" }); }
});
app.get("/game/:id", async (req, res) => {
    try {
        if (!accessToken) await getAccessToken();
        const id = req.params.id;
        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: { "Client-ID": CLIENT_ID, "Authorization": `Bearer ${accessToken}`, "Content-Type": "text/plain" },
            body: `where id = ${id}; fields name,summary,first_release_date, genres.name,rating,cover.url, screenshots.url,platforms.name,involved_companies.company.name;`
        });
        const data = await response.json();
        res.json(data[0]);
    } catch (err) { console.error(err); res.status(500).json({ error: "Error" }); }
});
app.get("/genres", async (req, res) => {
    try {
        if (!accessToken) await getAccessToken();
        const response = await fetch("https://api.igdb.com/v4/genres", {
            method: "POST",
            headers: { "Client-ID": CLIENT_ID, "Authorization": `Bearer ${accessToken}`, "Content-Type": "text/plain" },
            body: `fields name; limit 50;`
        });
        const data = await response.json();
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: "Error" }); }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => { console.log(`Gyors tesztelésre: http://localhost:${PORT}`); });