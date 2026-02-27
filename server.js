require("dotenv").config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Running on ${PORT}`));

const app = express();
app.use(cors());
app.use(express.json());

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let accessToken = "";
async function getAccessToken() {
    const response = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
        { method: "POST" }
    );

    const data = await response.json();
    accessToken = data.access_token;
}
app.get("/games", async (req, res) => {
    try {
        if (!accessToken) {
            await getAccessToken();
        }

        const search = req.query.search || "";
        const genre = req.query.genre || "";

        let genreFilter = "";
        if (genre) {
            genreFilter = `where genres = (${genre});`;
        }

        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": CLIENT_ID,
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "text/plain"
            },
            body: `
                search "${search}";
                ${genreFilter}
                fields name,summary,first_release_date,genres.name,rating,cover.url;
                limit 20;
            `
        });

        const data = await response.json();
        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Hiba történt" });
    }
});
app.get("/game/:id", async (req, res) => {
    try {
        if (!accessToken) {
            await getAccessToken();
        }

        const id = req.params.id;

        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": CLIENT_ID,
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "text/plain"
            },
            body: `
                where id = ${id};
                fields name,summary,first_release_date,
                genres.name,rating,cover.url,
                screenshots.url,platforms.name,involved_companies.company.name,*;
            `
        });

        const data = await response.json();
        res.json(data[0]);

    } catch (err) {
        res.status(500).json({ error: "Hiba történt" });
    }
});

app.listen(3000, () => {
    console.log("Server fut: http://localhost:3000");
});