const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    budget: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      type: { type: String, enum: ["fixed", "hourly"], default: "fixed" },
    },
    skills: [{ type: String, required: true }],
    duration: {
      type: String,
      enum: ["short", "medium", "long"],
      required: true,
    },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in-progress", "completed", "cancelled", "finished"],
      default: "open",
    },
    hiredFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    proposalsCount: { type: Number, default: 0 },
    attachments: [String],
    deadline: Date,
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ skills: 1, location: 1, status: 1 });
projectSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Project", projectSchema);
