const User = require("../models/User");
const bcrypt = require("bcryptjs"); // We use bcryptjs to prevent crashes
const jwt = require("jsonwebtoken");

// Use a secure key from .env or fallback
const SECRET = process.env.JWT_SECRET || "MitraChatSecretKey123";

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // 1. Find User
    const user = await User.findOne({ username });
    if (!user) {
      // Return status false so frontend throws error
      return res.json({ msg: "Incorrect Username or Password", status: false });
    }

    // 2. Check Password
    // We check if the stored password is encrypted or plain text (for safety)
    let isPasswordValid = false;
    if (user.password && user.password.startsWith("$2b$")) {
        isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
        isPasswordValid = password === user.password;
    }

    if (!isPasswordValid) {
      return res.json({ msg: "Incorrect Username or Password", status: false });
    }

    // 3. Remove password from response
    const userResp = user.toObject();
    delete userResp.password;

    // 4. Generate Token
    const token = jwt.sign({ id: user._id, username: user.username }, SECRET, {
      expiresIn: "30d",
    });

    return res.json({ status: true, user: userResp, token });
  } catch (ex) {
    next(ex);
  }
};

module.exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // 1. Check duplicate username
    const usernameCheck = await User.findOne({ username });
    if (usernameCheck) {
      return res.json({ msg: "Username already used", status: false });
    }
    
    // 2. Encrypt Password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 3. Create User 
    // We only pass username and password (email is NOT required by your schema)
    const user = await User.create({
      username,
      password: hashedPassword,
      avatar: "", 
      friends: [] // Initialize empty friends list
    });
    
    const userResp = user.toObject();
    delete userResp.password;

    const token = jwt.sign({ id: user._id, username: user.username }, SECRET, {
      expiresIn: "30d",
    });

    return res.json({ status: true, user: userResp, token });
  } catch (ex) {
    next(ex);
  }
};