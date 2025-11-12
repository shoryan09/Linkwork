const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createReview,
  getReviewsByUser,
  checkReviewExists,
} = require("../controllers/reviewController");

// Protected routes
router.use(authMiddleware);

router.post("/", createReview);
router.get("/user/:userId", getReviewsByUser);
router.get("/check/:projectId", checkReviewExists);

module.exports = router;
