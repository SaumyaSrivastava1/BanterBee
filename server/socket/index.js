const users = {};        // userId → socketId
const openChats = {};    // userId → currently open chat partner

function socketHandlers(io) {
  io.on("connection", (socket) => {
    // when user connects
    socket.on("register", (userId) => {
      users[userId] = socket.id;
      console.log("User connected:", userId);
    });

    // user opened a chat window
    socket.on("open-chat", ({ userId, otherId }) => {
      openChats[userId] = otherId;
      console.log(`${userId} opened chat with ${otherId}`);
    });

    // user switched chat / closed chat window
    socket.on("close-chat", ({ userId }) => {
      delete openChats[userId];
      console.log(`${userId} closed chat`);
    });

    // user sends a message
    socket.on("send-message", (msg) => {
      const receiverId = msg.receiver;

      // deliver message
      if (users[receiverId]) {
        io.to(users[receiverId]).emit("receive-message", msg);
      }
    });

    // user saw messages
    socket.on("message-seen", ({ userId, otherId }) => {
      // notify sender that their messages were seen
      if (users[otherId]) {
        io.to(users[otherId]).emit("message-seen", {
          userId,
          otherId,
        });
      }
    });

    socket.on("disconnect", () => {
      Object.keys(users).forEach((uid) => {
        if (users[uid] === socket.id) delete users[uid];
      });
    });
  });
}

module.exports = socketHandlers;
