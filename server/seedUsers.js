// server/seedUsers.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // adjust path only if your model is elsewhere

const MONGO = process.env.MONGO_URL || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mern-chat";

async function main() {
  await mongoose.connect(MONGO);
  console.log("Connected to Mongo for seeding");

  const users = [
    { username: "user1", password: "pass123" },
    { username: "user2", password: "pass123" },
  ];

  for (const u of users) {
    const existing = await User.findOne({ username: u.username }).lean();
    if (existing) {
      console.log(`Skipping ${u.username} (already exists)`);
      continue;
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(u.password, salt);
    const doc = new User({ username: u.username, password: hash });
    await doc.save();
    console.log(`Created ${u.username}`);
  }

  await mongoose.disconnect();
  console.log("Seeding completed");
}

main().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
