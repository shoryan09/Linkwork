const Chat = require("../models/Chat");
const Project = require("../models/Project");
const Message = require("../models/Message");
const { getIO } = require("../utils/socket");

exports.startChatIfNotExists = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project || !project.hiredFreelancer) {
    return null;
  }
  let chat = await Chat.findOne({ projectId });
  if (!chat) {
    chat = await Chat.create({
      projectId,
      participants: [project.clientId, project.hiredFreelancer],
    });
  }
  return chat;
};

exports.getChatByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    // Ensure requester is participant
    const isParticipant =
      project.clientId.toString() === req.user._id.toString() ||
      project.hiredFreelancer?.toString() === req.user._id.toString();
    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized for this chat" });
    }
    const chat = await exports.startChatIfNotExists(project._id);
    res.json({ chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate("participants", "displayName");
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    // Ensure requester is participant
    const isParticipant = chat.participants
      .map((p) => p._id.toString())
      .includes(req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    res.json({ chat, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const { text = "", attachments = [] } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    // Ensure requester is participant
    const isParticipant = chat.participants
      .map((p) => p.toString())
      .includes(req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }
    // Mark sender as already read
    const message = await Message.create({
      chatId: chat._id,
      senderId: req.user._id,
      text,
      attachments,
      readBy: [req.user._id],
    });
    const io = getIO();
    if (io) {
      io.to(`chat:${chat._id.toString()}`).emit("message:new", {
        chatId: chat._id.toString(),
        message,
      });
      // Notify other participants about unread count
      chat.participants.forEach((uid) => {
        if (uid.toString() !== req.user._id.toString()) {
          io.to(uid.toString()).emit("unread:update", {
            chatId: chat._id.toString(),
          });
        }
      });
    }
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markMessagesAsRead = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const isParticipant = chat.participants
      .map((p) => p.toString())
      .includes(req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }
    // Mark all unread messages in this chat as read by this user
    await Message.updateMany(
      {
        chatId: chat._id,
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    // Get all chats user is part of
    const chats = await Chat.find({
      participants: req.user._id,
    });
    const chatIds = chats.map((c) => c._id);
    
    // Get unread counts per chat
    const unreadCounts = await Promise.all(
      chats.map(async (chat) => {
        const count = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: req.user._id }, // Only count messages from others
          readBy: { $ne: req.user._id },
        });
        return {
          chatId: chat._id.toString(),
          projectId: chat.projectId.toString(),
          count,
        };
      })
    );
    
    const totalUnread = unreadCounts.reduce((sum, c) => sum + c.count, 0);
    
    res.json({ unreadCounts, totalUnread });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllChats = async (req, res) => {
  try {
    // Get all chats user is part of
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate("projectId", "title status")
      .populate("participants", "displayName profile.avatar")
      .sort({ updatedAt: -1 });

    // Get unread counts and last message for each chat
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
        });

        const lastMessage = await Message.findOne({ chatId: chat._id })
          .sort({ createdAt: -1 })
          .limit(1);

        // Get the other participant (not the current user)
        const otherParticipant = chat.participants.find(
          (p) => p._id.toString() !== req.user._id.toString()
        );

        return {
          _id: chat._id,
          projectId: chat.projectId?._id,
          projectTitle: chat.projectId?.title,
          projectStatus: chat.projectId?.status,
          otherParticipant: otherParticipant
            ? {
                _id: otherParticipant._id,
                displayName: otherParticipant.displayName,
                avatar: otherParticipant.profile?.avatar,
              }
            : null,
          unreadCount,
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : null,
          updatedAt: chat.updatedAt,
        };
      })
    );

    res.json({ chats: chatsWithDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getChatByProject: exports.getChatByProject,
  getMessages: exports.getMessages,
  postMessage: exports.postMessage,
  markMessagesAsRead: exports.markMessagesAsRead,
  getUnreadCount: exports.getUnreadCount,
  getAllChats: exports.getAllChats,
};
