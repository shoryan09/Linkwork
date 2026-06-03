const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const {
  createProposal,
  getProposalsByProject,
  getMyProposals,
  updateProposalStatus,
} = require("../controllers/proposalController");

// All routes require authentication
router.use(authMiddleware);

// Freelancers can submit and view their proposals
router.post("/", checkRole("freelancer", "both"), createProposal);
router.get("/my", checkRole("freelancer", "both"), getMyProposals);

// Clients can view proposals on their projects and update status
router.get(
  "/project/:projectId",
  checkRole("client", "both"),
  getProposalsByProject
);
router.put(
  "/:id/status",
  checkRole("client", "both"),
  updateProposalStatus
);

module.exports = router;
