const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video", "document", "file", "link"], required: true },
    url: { type: String, required: true },
    filename: { type: String },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: { type: String, default: "" },
    attachments: [attachmentSchema],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ chatId: 1, readBy: 1 });

module.exports = mongoose.model("Message", messageSchema);


