const request = require("supertest");
const app = require("../server");
const User = require("../models/User");

describe("Auth API", () => {
  describe("POST /api/auth/signup", () => {
    it("should create a new user", async () => {
      const userData = {
        firebaseUid: "test-uid-123",
        email: "test@example.com",
        displayName: "Test User",
        role: "freelancer",
      };

      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe("User created successfully");
      expect(response.body.user.email).toBe(userData.email);
    });

    it("should not create duplicate user", async () => {
      const userData = {
        firebaseUid: "test-uid-123",
        email: "test@example.com",
        displayName: "Test User",
        role: "freelancer",
      };

      await User.create(userData);

      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe("User already exists");
    });
  });
});
