const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // SAFETY FIX: Added fallback secret to prevent crashes if .env is missing
    const SECRET = process.env.JWT_SECRET || "MitraChatSecretKey123";

    // Verify token
    const decoded = jwt.verify(token, SECRET);

    // Find user to ensure they still exist in DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // attach full user document to request
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Token invalid" });
  }
};

module.exports = authMiddleware;