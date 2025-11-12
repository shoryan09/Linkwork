const Review = require("../models/Review");
const User = require("../models/User");
const Project = require("../models/Project");
const Notification = require("../models/Notification");
const { getIO } = require("../utils/socket");

exports.createReview = async (req, res) => {
  try {
    const { projectId, revieweeId, rating, comment, reviewType, detailedRatings } = req.body;

    const project = await Project.findById(projectId);

    if (!project || (project.status !== "completed" && project.status !== "finished")) {
      return res
        .status(400)
        .json({ error: "Can only review completed or finished projects" });
    }

    const review = await Review.create({
      projectId,
      reviewerId: req.user._id,
      revieweeId,
      rating,
      comment,
      reviewType,
      detailedRatings,
    });

    // Update user rating
    const reviews = await Review.find({ revieweeId });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const updatedUser = await User.findByIdAndUpdate(
      revieweeId,
      {
        "rating.average": avgRating,
        "rating.count": reviews.length,
      },
      { new: true }
    );

    // Notify reviewee
    const notification = await Notification.create({
      userId: revieweeId,
      type: "review",
      title: "New Review Received",
      message: `You received a ${rating}-star review from a freelancer`,
      relatedId: review._id,
      relatedModel: "Review",
    });

    // Emit Socket.IO events for real-time updates
    const io = getIO();
    if (io) {
      console.log(`Sending rating notification to client: ${revieweeId.toString()}`);
      
      // Send notification (only to client who was rated)
      io.to(revieweeId.toString()).emit("notification:new", notification);
      
      // Send rating update for real-time display (only to client who was rated)
      io.to(revieweeId.toString()).emit("rating:updated", {
        userId: revieweeId,
        rating: {
          average: updatedUser.rating.average,
          count: updatedUser.rating.count,
        },
      });
    }

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "You have already reviewed this project" });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getReviewsByUser = async (req, res) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId })
      .populate("reviewerId", "displayName profile.avatar")
      .populate("projectId", "title")
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkReviewExists = async (req, res) => {
  try {
    const { projectId } = req.params;
    const review = await Review.findOne({
      projectId,
      reviewerId: req.user._id,
    });

    res.json({ exists: !!review, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
