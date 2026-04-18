const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fetch = require("node-fetch");

/**
 * Configure environment variables for test execution
 */
process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.MONGO_URI = "mongodb://localhost:27017/test";
process.env.CLIENT_ID = "test";
process.env.CLIENT_SECRET = "test";

/**
 * Global API and Dependency Mocking
 */
jest.mock("node-fetch");
jest.mock("uuid", () => ({ v4: () => "test-uuid-123" }));
jest.spyOn(mongoose, "connect").mockResolvedValue(mongoose);

let app;

beforeAll(async () => {
  /**
   * Initialize Express application instance
   */
  app = require("./server");
});

afterAll(async () => {
  /**
   * Cleanup database connections and restore mocks
   */
  jest.restoreAllMocks();
  await mongoose.disconnect();
});

beforeEach(() => {
  /**
   * Reset state between individual tests
   */
  jest.clearAllMocks();
  fetch.mockResolvedValue({ 
    json: jest.fn().mockResolvedValue([{ game_id: 1, value: 100 }]),
    ok: true 
  });
});

describe("API Integration Tests", () => {
  test("POST /api/register - User Registration", async () => {
    jest.spyOn(mongoose.Model, "findOne").mockResolvedValue(null);
    jest.spyOn(mongoose.Model.prototype, "save").mockResolvedValue(true);
    const res = await request(app)
      .post("/api/register")
      .send({ email: "a@a.com", username: "u", password: "p", birthdate: "2000-01-01" });
    expect(res.status).toBe(200);
  });

  test("POST /api/login - User Authentication", async () => {
    jest.spyOn(mongoose.Model, "findOne").mockResolvedValue({ username: "u", password: "h", isAdult: true });
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
    const res = await request(app)
      .post("/api/login")
      .send({ username: "u", password: "p" });
    expect(res.status).toBe(200);
  });

  test("GET /api/favorites/:username - Fetch User Favorites", async () => {
    jest.spyOn(mongoose.Model, "findOne").mockResolvedValue({ favorites: [] });
    const res = await request(app).get("/api/favorites/u");
    expect(res.status).toBe(200);
  });

  test("POST /api/favorites - Add Entry to Favorites", async () => {
    jest.spyOn(mongoose.Model, "findOne").mockResolvedValue({ 
      favorites: [], 
      save: jest.fn().mockResolvedValue(true), 
      markModified: jest.fn() 
    });
    const res = await request(app)
      .post("/api/favorites")
      .send({ username: "u", game: { id: 1 } });
    expect(res.status).toBe(200);
  });

  test("POST /api/popularity - Update Game Popularity Metrics", async () => {
    const res = await request(app).post("/api/popularity").send({ ids: [1] });
    expect(res.status).toBe(200);
  });

  test("GET /games/popular - Retrieve Trending Content", async () => {
    const res = await request(app).get("/games/popular");
    expect(res.status).toBe(200);
  });

  test("GET /games - General Catalog Access", async () => {
    const res = await request(app).get("/games");
    expect(res.status).toBe(200);
  });

  test("GET /game/:id - Detail View Retrieval", async () => {
    const res = await request(app).get("/game/1");
    expect(res.status).toBe(200);
  });

  test("GET /genres - Metadata Enumeration (Genres)", async () => {
    const res = await request(app).get("/genres");
    expect(res.status).toBe(200);
  });

  test("GET /platforms - Metadata Enumeration (Platforms)", async () => {
    const res = await request(app).get("/platforms");
    expect(res.status).toBe(200);
  });

  test("GET /companies - Metadata Enumeration (Companies)", async () => {
    const res = await request(app).get("/companies");
    expect(res.status).toBe(200);
  });

  test("GET /api/admin/users - Administrative User Listing", async () => {
    jest.spyOn(mongoose.Model, "find").mockResolvedValue([]);
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(200);
  });

  test("GET /api/admin/level/:username - Access Control Verification", async () => {
    jest.spyOn(mongoose.Model, "findOne").mockResolvedValue({ isAdmin: true, adminLevel: 1 });
    const res = await request(app).get("/api/admin/level/admin");
    expect(res.status).toBe(200);
  });

  test("POST /api/admin/toggle - Admin Privilege Escalation", async () => {
    jest.spyOn(mongoose.Model, "findOne")
      .mockResolvedValueOnce({ username: "a", isAdmin: true, adminLevel: 0 })
      .mockResolvedValueOnce({ username: "t", isAdmin: false, save: jest.fn().mockResolvedValue(true) });
    const res = await request(app)
      .post("/api/admin/toggle")
      .send({ requestedBy: "a", username: "t", isAdmin: true, adminLevel: 1 });
    expect(res.status).toBe(200);
  });

  test("POST /api/admin/rename - User Identity Modification", async () => {
    jest.spyOn(mongoose.Model, "findOne")
      .mockResolvedValueOnce({ username: "a", isAdmin: true, adminLevel: 0 })
      .mockResolvedValueOnce({ username: "t", save: jest.fn().mockResolvedValue(true) })
      .mockResolvedValueOnce(null);
    const res = await request(app)
      .post("/api/admin/rename")
      .send({ requestedBy: "a", oldUsername: "t", newUsername: "n" });
    expect(res.status).toBe(200);
  });

  test("POST /api/admin/delete - Account Termination", async () => {
    jest.spyOn(mongoose.Model, "findOne")
      .mockResolvedValueOnce({ username: "a", isAdmin: true, adminLevel: 0 })
      .mockResolvedValueOnce({ username: "t", isAdmin: false });
    jest.spyOn(mongoose.Model, "deleteOne").mockResolvedValue({ deletedCount: 1 });
    const res = await request(app)
      .post("/api/admin/delete")
      .send({ requestedBy: "a", username: "t" });
    expect(res.status).toBe(200);
  });

  test("POST /api/admin/toggle-adult - Age Verification Override", async () => {
    jest.spyOn(mongoose.Model, "findOne")
      .mockResolvedValueOnce({ username: "a", isAdmin: true, adminLevel: 1 })
      .mockResolvedValueOnce({ username: "t", isAdult: false, save: jest.fn().mockResolvedValue(true) });
    const res = await request(app)
      .post("/api/admin/toggle-adult")
      .send({ requestedBy: "a", username: "t" });
    expect(res.status).toBe(200);
  });
});