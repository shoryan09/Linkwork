const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    reviewType: {
      type: String,
      enum: ["client-to-freelancer", "freelancer-to-client"],
      required: true,
    },
    // Detailed ratings (for freelancer-to-client reviews)
    detailedRatings: {
      pay: { type: Number, min: 1, max: 5 },
      workingExperience: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
      likelyToWork: { type: Number, min: 1, max: 5 },
      recommendToFriends: { type: Number, min: 1, max: 5 },
    },
  },
  { timestamps: true }
);

reviewSchema.index({ projectId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
