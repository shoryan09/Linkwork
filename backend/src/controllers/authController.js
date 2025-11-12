const User = require("../models/User");
const { admin } = require("../utils/firebaseAdmin");

exports.signup = async (req, res) => {
  try {
    const { firebaseUid, email, displayName, role, profile } = req.body;

    const existingUser = await User.findOne({
      $or: [{ firebaseUid }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const user = await User.create({
      firebaseUid,
      email,
      displayName,
      role,
      profile: profile || {},
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-__v -firebaseUid");
    // Transform _id to id for frontend consistency
    const userObj = user.toObject();
    userObj.id = userObj._id.toString();
    delete userObj._id;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ["displayName", "profile"];
    const filteredUpdates = {};

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, filteredUpdates, {
      new: true,
      runValidators: true,
    });

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-firebaseUid -__v");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if Firebase Admin is initialized
    const isFirebaseInitialized = admin && 
                                    admin.apps && 
                                    admin.apps.length > 0 && 
                                    typeof admin.auth === 'function';
    
    if (!isFirebaseInitialized) {
      console.error("Firebase Admin SDK not initialized or auth not available");
      console.log("Admin exists:", !!admin);
      console.log("Admin.apps exists:", admin && !!admin.apps);
      console.log("Admin.apps.length:", admin && admin.apps && admin.apps.length);
      console.log("Admin.auth exists:", admin && typeof admin.auth === 'function');
      return res.status(503).json({ 
        error: "Password change service is temporarily unavailable. Please contact support." 
      });
    }

    // Update password in Firebase
    try {
      console.log("Attempting to update password for user:", user.firebaseUid);
      await admin.auth().updateUser(user.firebaseUid, {
        password: newPassword,
      });
      console.log("Password updated successfully in Firebase");
    } catch (firebaseError) {
      console.error("Firebase password update error:", firebaseError);
      return res.status(500).json({ 
        error: "Failed to update password in authentication service" 
      });
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: error.message || "Failed to change password" });
  }
};
