const Message = require("../models/Message");
const mongoose = require("mongoose");

/**
 * Helpers
 */
const asString = (v) => (v == null ? "" : String(v));
const toObjectIdIfValid = (val) =>
  mongoose.Types.ObjectId.isValid(String(val)) ? new mongoose.Types.ObjectId(String(val)) : val;

/**
 * SEND MESSAGE (POST /api/messages/send)
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { sender, receiver, text } = req.body;
    
    if (!sender || !receiver || !text) {
      console.log("sendMessage failed: Missing fields", req.body);
      return res.status(400).json({ message: "Missing sender, receiver or text" });
    }

    const senderId = toObjectIdIfValid(sender);
    const receiverId = toObjectIdIfValid(receiver);

    const message = await Message.create({
      text: text,
      users: [senderId, receiverId], // Keeping this as you had it
      sender: senderId,
      receiver: receiverId,
      read: false,
    });

    // Socket Emit
    try {
      if (global.io) {
        // Emit to Receiver
        global.io.to(`user:${asString(receiver)}`).emit("receive-message", message);
        // Emit to Sender (so it shows up on your other tabs)
        global.io.to(`user:${asString(sender)}`).emit("receive-message", message);
      }
    } catch (e) {
      console.error("Socket emit error:", e);
    }

    return res.status(201).json(message);
  } catch (err) {
    console.error("Save Message Error:", err);
    return res.status(500).json({ message: "Failed to save message to DB" });
  }
};

/**
 * GET CHAT HISTORY
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    if (!userId || !otherId) return res.status(400).json({ message: "Missing params" });

    const me = toObjectIdIfValid(userId);
    const other = toObjectIdIfValid(otherId);

    // 1. Mark messages from 'other' -> 'me' as READ
    const updateResult = await Message.updateMany(
      {
        sender: other,
        receiver: me,
        read: false,
        deletedFor: { $ne: me }, 
      },
      { $set: { read: true } }
    );

    // 2. Real-time Blue Ticks for the sender
    const updatedCount = updateResult.modifiedCount || updateResult.nModified || 0;
    if (updatedCount > 0 && global.io) {
       global.io.to(`user:${asString(otherId)}`).emit("messages-read", {
         reader: asString(userId),
         other: asString(otherId),
       });
    }

    // 3. Fetch history 
    const messages = await Message.find({
      $and: [
        {
          $or: [
            { sender: me, receiver: other },
            { sender: other, receiver: me },
          ],
        },
        { deletedFor: { $ne: me } },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.json(messages);
  } catch (err) {
    console.error("Fetch Error:", err?.message ?? err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * MARK READ
 */
exports.markRead = async (req, res) => {
  try {
    const { userId, otherId } = req.body;
    if (!userId || !otherId) return res.status(400).json({ message: "Missing userId/otherId" });

    const me = toObjectIdIfValid(userId);
    const other = toObjectIdIfValid(otherId);

    const result = await Message.updateMany(
      {
        sender: other,
        receiver: me,
        read: false,
        deletedFor: { $ne: me }, 
      },
      { $set: { read: true } }
    );

    try {
      if (global.io) {
        global.io.to(`user:${asString(otherId)}`).emit("messages-read", {
          reader: asString(userId),
          other: asString(otherId),
        });
      }
    } catch (e) {
      console.error("socket emit error (markRead):", e?.message ?? e);
    }

    const updatedCount = result.modifiedCount ?? result.nModified ?? 0;
    return res.json({ updated: updatedCount });
  } catch (err) {
    console.error("MarkRead Error:", err?.message ?? err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * CLEAR CHAT
 */
exports.clearChat = async (req, res) => {
  try {
    let { userId, otherId } = req.params;
    if (!userId || !otherId) return res.status(400).json({ message: "Missing userId/otherId" });

    const me = toObjectIdIfValid(userId);
    const other = toObjectIdIfValid(otherId);
    const meStr = asString(userId);
    const otherStr = asString(otherId);

    await Message.updateMany(
      {
        $or: [
          { sender: me, receiver: other },
          { sender: other, receiver: me },
        ],
      },
      { $addToSet: { deletedFor: me } }
    );

    try {
      if (global.io) {
        global.io.to(`user:${meStr}`).emit("chat-cleared", { by: meStr, other: otherStr });
      }
    } catch (e) {
      console.error("socket emit error (clearChat):", e?.message ?? e);
    }

    return res.json({ message: "Chat cleared for user" });
  } catch (err) {
    console.error("Clear Chat Error:", err?.message ?? err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * UNREAD SUMMARY
 */
exports.getUnreadSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const receiverMatch = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : String(userId);

    const result = await Message.aggregate([
      {
        $match: {
          receiver: receiverMatch,
          read: false,
          deletedFor: { $ne: receiverMatch },
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = result.map((r) => ({
      userId: r._id ? String(r._id) : "",
      count: r.count ?? 0,
    }));

    return res.json(summary);
  } catch (err) {
    console.error("Unread summary error:", err?.message ?? err);
    return res.status(500).json({ message: "Server error" });
  }
};