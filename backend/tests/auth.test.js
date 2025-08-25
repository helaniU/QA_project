const request = require("supertest");
const { app, server } = require("../index");
const mongoose = require("mongoose");


describe("Auth API", () => {
  it("should reject missing name on register", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "", email: "user@example.com", password: "12345" });
    expect(res.status).toBe(400);
  });

  it("should reject invalid email on register", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "User", email: "bad-email", password: "Password123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it("should register user with valid input", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "user@example.com", password: "Password123" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("name", "Test User");
    expect(res.body).toHaveProperty("email", "user@example.com");
  });

  it("should login with correct credentials", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "test@example.com", password: "Secret123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Secret123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/success/i);
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "wrong" });
    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  await mongoose.connection.close(); // close MongoDB connection
  server.close();              // close Express server if exported
});
