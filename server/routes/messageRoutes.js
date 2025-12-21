const express = require("express");
const { 
  sendMessage, 
  getChatHistory, 
  markRead, 
  clearChat, 
  getUnreadSummary 
} = require("../controllers/messageController");

const router = express.Router();

// --- POST ROUTES ---
router.post("/send", sendMessage);
router.post("/addmsg", sendMessage); // Keeping both for safety
router.post("/mark-read", markRead);


// --- GET ROUTES (Order Matters!) ---

// 1. SPECIFIC ROUTE FIRST
// This must be above the generic route so "unread-summary" isn't treated as an ID
router.get("/unread-summary/:userId", getUnreadSummary);

// 2. GENERIC ROUTE SECOND
// Matches /api/messages/123/456
router.get("/:userId/:otherId", getChatHistory);


// --- DELETE ROUTES ---
router.delete("/:userId/:otherId", clearChat);

module.exports = router;