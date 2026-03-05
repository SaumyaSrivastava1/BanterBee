const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

// --- 1. SEND REQUEST ---
module.exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    // Check if they are already friends
    const sender = await User.findById(from);
    if (sender.friends.includes(to)) {
      return res.json({ msg: "You are already friends!", status: false });
    }

    // Check if a request is already pending (from either side)
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: from, receiver: to },
        { sender: to, receiver: from },
      ],
      status: "pending",
    });

    if (existingRequest) {
      return res.json({ msg: "Request already pending.", status: false });
    }

    // Create new request
    await FriendRequest.create({ sender: from, receiver: to });
    return res.json({ msg: "Friend Request Sent Successfully", status: true });
  } catch (ex) {
    next(ex);
  }
};

// --- 2. GET PENDING REQUESTS (For the "Requests" Tab) ---
module.exports.getPendingRequests = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Find requests where I am the RECEIVER and status is PENDING
    const requests = await FriendRequest.find({
      receiver: userId,
      status: "pending",
    }).populate("sender", "username avatar _id"); // Get sender details to show in UI

    return res.json(requests);
  } catch (ex) {
    next(ex);
  }
};

// --- 3. ACCEPT REQUEST ---
module.exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const request = await FriendRequest.findById(requestId);
    if (!request) return res.json({ msg: "Request not found.", status: false });

    // 1. Update Request Status
    request.status = "accepted";
    await request.save();

    // 2. Add Users to each other's friends list
    const senderId = request.sender;
    const receiverId = request.receiver;

    await User.findByIdAndUpdate(senderId, {
      $push: { friends: receiverId },
    });

    await User.findByIdAndUpdate(receiverId, {
      $push: { friends: senderId },
    });

    return res.json({ msg: "Friend Request Accepted!", status: true });
  } catch (ex) {
    next(ex);
  }
};

// --- 4. GET MY FRIENDS (For Chat List) ---
module.exports.getAllFriends = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate(
      "friends",
      "username email avatar _id"
    );
    return res.json(user.friends);
  } catch (ex) {
    next(ex);
  }
};

// --- 5. GET REQUESTS I SENT (To show "Pending" button) ---
module.exports.getSentRequests = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    // Find pending requests where I am the SENDER
    const requests = await FriendRequest.find({
      sender: userId,
      status: "pending",
    });
    
    // Return just the IDs of the people I requested
    const receiverIds = requests.map((r) => r.receiver);
    return res.json(receiverIds);
  } catch (ex) {
    next(ex);
  }
};

// --- 6. REMOVE FRIEND ---
module.exports.removeFriend = async (req, res, next) => {
  try {
    const { userId, friendId } = req.body;

    // 1. Remove from both users' friends arrays
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    // 2. Delete the friend request record (so they can add each other again later)
    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    });

    return res.json({ msg: "Friend removed successfully.", status: true });
  } catch (ex) {
    next(ex);
  }
};



// --- 7. DENY REQUEST ---
module.exports.denyFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    
    // We simply delete the request so it's no longer pending
    await FriendRequest.findByIdAndDelete(requestId);
    
    return res.json({ msg: "Friend request denied.", status: true });
  } catch (ex) {
    next(ex);
  }
};