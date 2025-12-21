const User = require("../models/User");

// GET /api/users/all
exports.getAllUsers = async (req, res) => {
  try {
    // IMPROVEMENT: Exclude current user from the list ( { _id: { $ne: req.user._id } } )
    // We don't want to chat with ourselves in the list
    const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    
    res.json(users);
  } catch (err) {
    console.error("Get all users error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/users/friends
exports.getFriends = async (req, res) => {
  try {
    // req.user is already populated by authMiddleware, but we populate friends details here
    const me = await User.findById(req.user._id).populate(
      "friends",
      "-password"
    );
    res.json(me?.friends || []);
  } catch (err) {
    console.error("Get friends error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/users/friends/:id
exports.addFriend = async (req, res) => {
  try {
    const friendId = req.params.id;

    const me = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { friends: friendId } }, // $addToSet avoids duplicates automatically
      { new: true }
    ).populate("friends", "-password");

    res.json(me.friends || []);
  } catch (err) {
    console.error("Add friend error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/users/friends/:id
exports.removeFriend = async (req, res) => {
  try {
    const friendId = req.params.id;

    const me = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { friends: friendId } }, // $pull removes the item
      { new: true }
    ).populate("friends", "-password");

    res.json(me.friends || []);
  } catch (err) {
    console.error("Remove friend error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/users/avatar
exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    // We allow empty string if user wants to remove avatar, so check strictly for undefined
    if (avatar === undefined) {
      return res.status(400).json({ message: "Avatar is required" });
    }

    // req.user is a Mongoose document, so we can modify and save
    req.user.avatar = avatar;
    await req.user.save();

    res.json({
      _id: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar,
    });
  } catch (err) {
    console.error("Update avatar error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/users/me
exports.deleteMe = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("Delete me error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};