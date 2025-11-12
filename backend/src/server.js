require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const gigRoutes = require("./routes/gigRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({ 
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://linkwork-final.vercel.app"
  ],
  credentials: true
}));
// Increase body size limit to 50MB to support file attachments (base64 encoded)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chats", chatRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// Socket.IO for real-time features
const io = require("socket.io")(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://linkwork-final.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
});
// Share io globally
const { setIO } = require("./utils/socket");
setIO(io);

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join-room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("chat:join", (chatId) => {
    if (!chatId) return;
    socket.join(`chat:${chatId}`);
  });

  socket.on("chat:leave", (chatId) => {
    if (!chatId) return;
    socket.leave(`chat:${chatId}`);
  });

  socket.on("send-message", (data) => {
    io.to(data.recipientId).emit("receive-message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

module.exports = app;
