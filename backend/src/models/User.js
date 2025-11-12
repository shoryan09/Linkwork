const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["client", "freelancer", "both"],
      required: true,
    },
    profile: {
      bio: String,
      skills: [String],
      location: String,
      hourlyRate: Number,
      avatar: String,
      phoneNumber: String,
      portfolio: String,
      age: Number,
      workExperience: String, // e.g., "5 years", "Fresher"
      about: String, // Detailed about section
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    completedProjects: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ "profile.skills": 1, "profile.location": 1 });
userSchema.index({ displayName: "text", "profile.bio": "text" });

module.exports = mongoose.model("User", userSchema);
