require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");            // <-- Changed to bcryptjs
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
  isAdmin: { type: Boolean, default: false },
  adminLevel: { type: Number, default: null },
  isAdult: { type: Boolean, default: false }
});
const User = mongoose.model("User", userSchema);

// ---------- Temporary bcrypt test route ----------
app.get("/test-bcrypt", async (req, res) => {
  const plain = "test123";
  const hash = await bcrypt.hash(plain, 10);
  const match = await bcrypt.compare(plain, hash);
  res.json({ plain, hash, match });
});

// ---------- User Auth ----------
app.post("/api/register", async (req, res) => {
  try {
    const { email, username, password, birthdate } = req.body;
    console.log(`[REGISTER] Attempt: ${email} / ${username}`);

    const existingUser = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { username: { $regex: new RegExp(`^${username}$`, 'i') } }
      ]
    });
    if (existingUser) {
      console.log(`[REGISTER] User already exists: ${email} / ${username}`);
      return res.status(400).json({ error: "Username or Email already exists!" });
    }

    const birthDateObj = new Date(birthdate);
    if (isNaN(birthDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid birthdate format. Use YYYY-MM-DD." });
    }

    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    const isAdult = age >= 18;

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`[REGISTER] Generated hash: ${hashedPassword.substring(0, 20)}...`);

    const newUser = new User({
      userId: uuidv4(),
      email,
      username,
      password: hashedPassword,
      isAdult
    });
    await newUser.save();
    console.log(`[REGISTER] User saved successfully: ${username}`);
    res.json({ message: "Successful registration!" });
    } catch (err) {
      console.error("Registration Error:", err.message, err.code);
      res.status(400).json({ error: err.message }); // show real error in toast
    }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`[LOGIN] Attempt: ${username} / ${password}`);
  
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (!user) {
      console.log(`[LOGIN] User not found: ${username}`);
      return res.status(401).json({ error: "User not found!" });
    }

    console.log(`[LOGIN] Stored hash for ${username}: ${password} - ${user.password}`);
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(`[LOGIN] bcrypt.compare result: ${passwordMatch}`);

    if (!passwordMatch) {
      console.log(`[LOGIN] Password mismatch for: ${username}`);
      return res.status(401).json({ error: "Wrong credentials!" });
    }

    console.log(`[LOGIN] Success: ${username}`);
    res.json({ username: user.username, isAdult: user.isAdult });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed!" });
  }
});

// ---------- Favorites ----------
app.get("/api/favorites/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found!" });
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: "Error fetching favorites" });
  }
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { username, game } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Not logged in!" });
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
    const isAdult = req.query.adult !== "false";
    const twoYearsAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365 * 2;
    let body = `fields name,summary,first_release_date,genres.name,rating,rating_count,cover.url,platforms,involved_companies.company.name; where rating != null & rating_count > 10 & first_release_date > ${twoYearsAgo}`;
    if (!isAdult) body += ` & themes != 42`;
    body += `; sort rating_count desc; limit 500;`;
    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
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
    const isAdult = req.query.adult !== "false";

    const conditions = [];
    if (genre) conditions.push(`genres = (${genre})`);
    if (!isAdult) conditions.push(`themes != 42`);

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
      body: `fields name; limit 50;`,
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

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

// ---------- Admin Endpoints ----------
async function requireAdmin(req, res, next) {
  const { requestedBy } = req.body;
  if (!requestedBy) {
    return res.status(401).json({ error: "Missing requester username" });
  }
  const adminUser = await User.findOne({ username: requestedBy });
  if (!adminUser || !adminUser.isAdmin) {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  req.adminUser = adminUser;
  next();
}

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find({}, "username email isAdmin adminLevel timeStamp isAdult");
    res.json(users.map(u => ({
      username: u.username,
      email: u.email,
      isAdmin: u.isAdmin || false,
      adminLevel: u.adminLevel,
      createdAt: u.timeStamp,
      isAdult: u.isAdult
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/admin/level/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      isAdmin: user.isAdmin || false,
      adminLevel: user.adminLevel
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/toggle", requireAdmin, async (req, res) => {
  try {
    const { username, isAdmin, adminLevel } = req.body;
    const targetUser = await User.findOne({ username });
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    const requesterLevel = req.adminUser.adminLevel;

    if (targetUser.username === req.adminUser.username) {
      return res.status(403).json({ error: "Cannot modify your own admin status" });
    }

    if (targetUser.isAdmin) {
      if (targetUser.adminLevel < requesterLevel) {
        return res.status(403).json({ error: "Cannot modify a higher-level admin" });
      }
    }

    if (isAdmin) {
      if (adminLevel < requesterLevel) {
        return res.status(403).json({ error: `You can only assign levels greater than or equal to your own (your level: ${requesterLevel})` });
      }
      if (requesterLevel !== 0 && adminLevel === requesterLevel) {
        return res.status(403).json({ error: "Only Level 0 admins can assign the same level" });
      }
      if (adminLevel < 0 || adminLevel > 3) {
        return res.status(400).json({ error: "Admin level must be between 0 and 3" });
      }
    }

    targetUser.isAdmin = isAdmin;
    targetUser.adminLevel = isAdmin ? adminLevel : null;
    await targetUser.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/rename", requireAdmin, async (req, res) => {
  try {
    if (req.adminUser.adminLevel !== 0) {
      return res.status(403).json({ error: "Only Level 0 admins can rename users" });
    }

    const { oldUsername, newUsername } = req.body;
    const targetUser = await User.findOne({ username: oldUsername });
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (targetUser.isAdmin && targetUser.adminLevel < req.adminUser.adminLevel) {
      return res.status(403).json({ error: "Cannot rename a higher-level admin" });
    }

    const existing = await User.findOne({ username: newUsername });
    if (existing) return res.status(400).json({ error: "Username already taken" });

    targetUser.username = newUsername;
    await targetUser.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/delete", requireAdmin, async (req, res) => {
  try {
    const { username } = req.body;
    const targetUser = await User.findOne({ username });
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (targetUser.username === req.adminUser.username) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    if (targetUser.isAdmin && targetUser.adminLevel < req.adminUser.adminLevel) {
      return res.status(403).json({ error: "Cannot delete a higher-level admin" });
    }

    await User.deleteOne({ username });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/toggle-adult", requireAdmin, async (req, res) => {
  try {
    const { username } = req.body;
    const targetUser = await User.findOne({ username });
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (req.adminUser.adminLevel > 1) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    targetUser.isAdult = !targetUser.isAdult;
    await targetUser.save();
    res.json({ success: true, isAdult: targetUser.isAdult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});