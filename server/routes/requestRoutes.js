const {
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  getAllFriends,
  getSentRequests,
  removeFriend,
  denyFriendRequest
} = require("../controllers/requestController");

const router = require("express").Router();

router.post("/send", sendFriendRequest);
router.post("/accept", acceptFriendRequest);
router.post("/remove", removeFriend);
router.get("/pending/:userId", getPendingRequests);
router.get("/friends/:userId", getAllFriends);
router.get("/sent/:userId", getSentRequests);
router.post("/deny", denyFriendRequest);

module.exports = router;