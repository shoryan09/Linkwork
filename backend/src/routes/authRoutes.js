const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  signup,
  getProfile,
  updateProfile,
  getUserById,
  changePassword,
} = require("../controllers/authController");

// Public routes
router.post("/signup", signup);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

// This route must come last to avoid conflicts with /profile
router.get("/:id", getUserById);

module.exports = router;
