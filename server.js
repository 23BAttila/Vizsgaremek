require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas! (｡◕‿◕｡)"))
  .catch(err => console.error("Could not connect to MongoDB:", err));

const userSchema = new mongoose.Schema({
  timeStamp: { type: Date, required: true, default: Date.now },
  userId: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: { type: Array, default: [] },
});
const User = mongoose.model("User", userSchema);

// ---------- User Auth ----------
app.post("/api/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "Username or Email already exists!"});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      userId: uuidv4(),
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save();
    res.json({ message: "Successful registration!"});
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(400).json({ error: "Database error or invalid data."});
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ username: user.username });
    } else {
      res.status(401).json({ error: "Wrong credentials!"});
    }
  } catch (err) {
    res.status(500).json({ error: "Login failed!"});
  }
});

// ---------- Favorites ----------
app.get("/api/favorites/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found!"});
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: "Error fetching favorites"});
  }
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { username, game } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Not logged in!"});
    const existingIndex = user.favorites.findIndex(f => f.id === game.id);
    let isFavorite = false;
    if (existingIndex > -1) {
      user.favorites.splice(existingIndex, 1);
      isFavorite = false;
    } else {
      user.favorites.push(game);
      isFavorite = true;
    }
    user.markModified("favorites");
    await user.save();
    res.json({
      message: isFavorite ? "Added to favorites" : "Removed from favorites",
      isFavorite,
    });
  } catch (err) {
    res.status(500).json({ error: "Error updating favorites" });
  }
});

// ---------- IGDB Auth ----------
let accessToken = "";

async function getAccessToken() {
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );
  const data = await response.json();
  accessToken = data.access_token;
}

// ---------- Popularity ----------
app.post("/api/popularity", async (req, res) => {
  try {
    if (!accessToken) await getAccessToken();
    const { ids } = req.body;
    if (!ids || ids.length === 0) return res.json({});
    const response = await fetch("https://api.igdb.com/v4/popularity_primitives", {
      method: "POST",
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: `fields game_id,value,popularity_type; where game_id = (${ids.join(",")}) & popularity_type = 1; limit 500;`,
    });
    const data = await response.json();
    const map = {};
    data.forEach(p => { map[p.game_id] = p.value; });
    res.json(map);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// ---------- Games Endpoints ----------
app.get("/games/popular", async (req, res) => {
  try {
    if (!accessToken) await getAccessToken();
    const twoYearsAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365 * 2;
    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: `fields name,summary,first_release_date,genres.name,rating,rating_count,cover.url,platforms,involved_companies.company.name; where rating != null & rating_count > 10 & first_release_date > ${twoYearsAgo}; sort rating_count desc; limit 500;`,
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

app.get("/games", async (req, res) => {
  try {
    if (!accessToken) await getAccessToken();
    const search = req.query.search || "";
    const genre = req.query.genre || "";
    const conditions = [];
    if (genre) conditions.push(`genres = (${genre})`);
    const whereClause = conditions.length ? `where ${conditions.join(" & ")};` : "";
    const searchClause = search ? `search "${search}";` : "";
    const queryBody = `fields name,summary,first_release_date,genres.name,rating,rating_count,cover.url,platforms,involved_companies.company.name; ${searchClause} ${whereClause} limit 500;`;
    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: queryBody,
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

app.get("/game/:id", async (req, res) => {
  try {
    if (!accessToken) await getAccessToken();
    const id = req.params.id;
    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: `where id = ${id}; fields name,summary,first_release_date,genres.name,rating,cover.url,screenshots.url,platforms.name,involved_companies.company.name;`,
    });
    const data = await response.json();
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

app.get("/genres", async (req, res) => {
  try {
    if (!accessToken) await getAccessToken();
    const response = await fetch("https://api.igdb.com/v4/genres", {
      method: "POST",
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: `fields name; limit 300;`,
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// NEW: Platforms endpoint
app.get("/platforms", async (req, res) => {
  try {
    if (!accessToken) await getAccessToken();
    const response = await fetch("https://api.igdb.com/v4/platforms", {
      method: "POST",
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: `fields name; limit 500;`,
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// NEW: Companies endpoint (publishers/developers)
app.get("/companies", async (req, res) => {
  try {
    if (!accessToken) await getAccessToken();
    const response = await fetch("https://api.igdb.com/v4/companies", {
      method: "POST",
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: `fields name; where published != null | developed != null; limit 500;`,
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});