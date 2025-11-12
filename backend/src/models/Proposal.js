const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coverLetter: { type: String, required: true },
    proposedBudget: { type: Number, required: true },
    deliveryTime: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    attachments: [String],
  },
  { timestamps: true }
);

proposalSchema.index({ projectId: 1, freelancerId: 1 }, { unique: true });

module.exports = mongoose.model("Proposal", proposalSchema);
