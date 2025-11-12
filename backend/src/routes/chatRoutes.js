const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { 
  getChatByProject, 
  getMessages, 
  postMessage,
  markMessagesAsRead,
  getUnreadCount,
  getAllChats
} = require("../controllers/chatController");

router.use(authMiddleware);

// Get all chats for the user
router.get("/", getAllChats);

// Ensure chat exists and return it
router.get("/project/:projectId", getChatByProject);

// Unread counts
router.get("/unread", getUnreadCount);

// Messages
router.get("/:chatId/messages", getMessages);
router.post("/:chatId/messages", postMessage);
router.put("/:chatId/read", markMessagesAsRead);

module.exports = router;


