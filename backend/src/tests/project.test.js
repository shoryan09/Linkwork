const request = require("supertest");
const app = require("../server");
const Project = require("../models/Project");
const User = require("../models/User");

describe("Project API", () => {
  let clientUser;

  beforeEach(async () => {
    clientUser = await User.create({
      firebaseUid: "client-uid",
      email: "client@example.com",
      displayName: "Client User",
      role: "client",
    });
  });

  describe("GET /api/projects", () => {
    it("should return all open projects", async () => {
      await Project.create({
        title: "Test Project",
        description:
          "This is a test project with sufficient description length to meet requirements",
        clientId: clientUser._id,
        budget: { min: 5000, max: 10000, type: "fixed" },
        skills: ["JavaScript", "React"],
        duration: "medium",
        location: "Mumbai",
        status: "open",
      });

      const response = await request(app).get("/api/projects").expect(200);

      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].title).toBe("Test Project");
    });

    it("should filter projects by skills", async () => {
      await Project.create({
        title: "React Project",
        description:
          "This is a React project with sufficient description length for validation",
        clientId: clientUser._id,
        budget: { min: 5000, max: 10000, type: "fixed" },
        skills: ["React", "Node.js"],
        duration: "short",
        location: "Delhi",
        status: "open",
      });

      const response = await request(app)
        .get("/api/projects?skills=React")
        .expect(200);

      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].skills).toContain("React");
    });
  });
});
