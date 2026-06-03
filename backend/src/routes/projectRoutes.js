const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMyProjects,
} = require("../controllers/projectController");

// Public routes
router.get("/", getAllProjects);

// Protected routes
router.post("/", authMiddleware, createProject);
router.get("/my/projects", authMiddleware, getMyProjects);

// These routes must come after /my/projects to avoid route conflicts
router.get("/:id", getProjectById);
router.put("/:id", authMiddleware, updateProject);
router.delete("/:id", authMiddleware, deleteProject);

module.exports = router;
