// server/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getFriends,
  addFriend,
  removeFriend,
  updateAvatar,
  deleteMe,
} = require("../controllers/userController");

// all user routes require login
router.get("/all", authMiddleware, getAllUsers);
router.get("/friends", authMiddleware, getFriends);
router.post("/friends/:id", authMiddleware, addFriend);
router.delete("/friends/:id", authMiddleware, removeFriend);

router.put("/avatar", authMiddleware, updateAvatar);
router.delete("/me", authMiddleware, deleteMe);

module.exports = router;
