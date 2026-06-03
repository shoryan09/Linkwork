const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    skills: [{ type: String, required: true }],
    pricing: {
      basic: { price: Number, description: String, deliveryTime: Number },
      standard: { price: Number, description: String, deliveryTime: Number },
      premium: { price: Number, description: String, deliveryTime: Number },
    },
    images: [String],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    ordersCompleted: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

gigSchema.index({ title: "text", description: "text" });
gigSchema.index({ skills: 1, category: 1 });

module.exports = mongoose.model("Gig", gigSchema);
