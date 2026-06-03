const Proposal = require("../models/Proposal");
const Project = require("../models/Project");
const Notification = require("../models/Notification");
const { getIO } = require("../utils/socket");

exports.createProposal = async (req, res) => {
  try {
    const {
      projectId,
      coverLetter,
      proposedBudget,
      deliveryTime,
      attachments,
    } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.status !== "open") {
      return res
        .status(400)
        .json({ error: "Project is not accepting proposals" });
    }

    const proposal = await Proposal.create({
      projectId,
      freelancerId: req.user._id,
      coverLetter,
      proposedBudget,
      deliveryTime,
      attachments,
    });

    await Project.findByIdAndUpdate(projectId, {
      $inc: { proposalsCount: 1 },
    });

    // Create notification for client
    const notification = await Notification.create({
      userId: project.clientId,
      type: "proposal",
      title: "New Proposal Received",
      message: `You received a new proposal for "${project.title}"`,
      relatedId: proposal._id,
      relatedModel: "Proposal",
    });

    // Emit Socket.IO event for real-time notification
    const io = getIO();
    if (io) {
      io.to(project.clientId.toString()).emit("notification:new", notification);
    }

    res
      .status(201)
      .json({ message: "Proposal submitted successfully", proposal });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({
          error: "You have already submitted a proposal for this project",
        });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getProposalsByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const proposals = await Proposal.find({ projectId: req.params.projectId })
      .populate("freelancerId", "displayName profile rating")
      .sort({ createdAt: -1 });

    res.json({ proposals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancerId: req.user._id })
      .populate("projectId", "title budget status location duration clientId finishedAt")
      .sort({ createdAt: -1 });

    res.json({ proposals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const proposal = await Proposal.findById(req.params.id).populate(
      "projectId"
    );

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    const project = proposal.projectId;

    if (status === "accepted") {
      if (project.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await Project.findByIdAndUpdate(project._id, {
        status: "in-progress",
        hiredFreelancer: proposal.freelancerId,
      });

      await Proposal.updateMany(
        { projectId: project._id, _id: { $ne: proposal._id } },
        { status: "rejected" }
      );

      // Notify freelancer
      const notification = await Notification.create({
        userId: proposal.freelancerId,
        type: "proposal",
        title: "Proposal Accepted!",
        message: `Your proposal for "${project.title}" has been accepted`,
        relatedId: project._id,
        relatedModel: "Project",
      });

      // Emit Socket.IO event for real-time notification
      const io = getIO();
      if (io) {
        io.to(proposal.freelancerId.toString()).emit("notification:new", notification);
      }

      // Ensure chat exists and notify both parties
      try {
        const { startChatIfNotExists } = require("./chatController");
        const chat = await startChatIfNotExists(project._id);
        if (io && chat) {
          io.to(project.clientId.toString()).emit("chat:started", {
            projectId: project._id.toString(),
            chatId: chat._id.toString(),
          });
          io.to(proposal.freelancerId.toString()).emit("chat:started", {
            projectId: project._id.toString(),
            chatId: chat._id.toString(),
          });
        }
      } catch (e) {
        // best-effort chat start
        console.error("Chat start error:", e.message);
      }
    }

    proposal.status = status;
    await proposal.save();

    res.json({ message: "Proposal status updated", proposal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate("projectId");

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    const project = proposal.projectId;

    // Only allow client to delete rejected proposals
    if (project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (proposal.status !== "rejected") {
      return res.status(400).json({ error: "Only rejected proposals can be deleted" });
    }

    // Decrement proposals count
    await Project.findByIdAndUpdate(project._id, {
      $inc: { proposalsCount: -1 },
    });

    // Delete the proposal
    await Proposal.findByIdAndDelete(req.params.id);

    res.json({ message: "Proposal deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
