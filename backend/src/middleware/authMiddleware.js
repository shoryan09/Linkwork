const { verifyFirebaseToken } = require("../utils/firebaseAdmin");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await verifyFirebaseToken(token);

    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user;
    req.firebaseUid = decodedToken.uid;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Invalid token", details: error.message });
  }
};

module.exports = authMiddleware;
