const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const requestRoutes = require("./routes/requestRoutes"); // <--- ADDED: Request Routes

//const app = express();

// new
const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://banter-bee.vercel.app"
  ],
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.use(express.json({ limit: "50mb" }));

// --- 1. DEFINE ALLOWED ORIGINS ---
// This allows both Localhost (for dev) AND Vercel (for production)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://banter-bee.vercel.app",
  "https://banterbee.vercel.app"
];

// --- 2. MIDDLEWARE ---
//app.use(express.json({ limit: "50mb" }));

// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true,
// }));

// --- 2. MIDDLEWARE ---
// app.use(cors({
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));

// app.use(express.json({ limit: "50mb" }));

// --- 3. SOCKET SETUP ---
const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins, // Use the same array here
//     methods: ["GET", "POST"],
//     credentials: true
//   },
// });

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

global.io = io;

io.on("connection", (socket) => {
  // console.debug("[io] connection", socket.id);
  socket.on("join", (userId) => {
    if (!userId) return;
    const room = `user:${String(userId)}`;
    socket.join(room);
  });

  socket.on("send-message", (msg) => {
    const receiverId = String(msg?.receiver ?? "");
    const senderId = String(msg?.sender ?? "");
    if (receiverId) io.to(`user:${receiverId}`).emit("receive-message", msg);
    if (senderId) io.to(`user:${senderId}`).emit("receive-message", msg);
  });

  socket.on("messages-read", (payload) => {
    const { reader, other } = payload || {};
    if (reader && other) {
      io.to(`user:${String(other)}`).emit("messages-read", payload);
    }
  });
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/requests", requestRoutes); // <--- ADDED: Register the route here

// DATABASE & SERVER START
// Render sets PORT automatically, so we must use process.env.PORT
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://localhost:27017/mern-chat";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("📦 MongoDB Connected Successfully");
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });