const userModel = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;

//login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    //check existence of user
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    };

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    return res
      .cookie("fd_token", token, cookieOptions)
      .status(200)
      .json({ success: true, token, role: user.role, user: userData });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//register user
const RegisterUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exist = await userModel.findOne({ email });
    //checking is user already exist?
    if (exist) {
      return res
        .status(409)
        .json({ success: false, message: "User Already exist" });
      //409 Conflict,user already exists in the database, and creating a duplicate user is not allowed.
    }
    //validating email format and strong password.
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter valid email address" });
    }
    //validating strong password
    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter Strong password" });
    }
    //hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //create new object user(contains user data)
    const newUser = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
    });
    const user = await newUser.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    };
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    return res
      .cookie("fd_token", token, cookieOptions)
      .status(200)
      .json({ success: true, token, role: user.role, user: userData });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Promote the currently authenticated user to admin (use once, then you can remove this route)
const promoteToAdmin = async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({ success: false, message: "Missing userId" });
  }

  try {
    await userModel.findByIdAndUpdate(userId, { role: "admin" });
    return res.status(200).json({ success: true, message: "User promoted to admin" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Forgot password: generate token and send (or log) reset link
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      // Do not reveal whether user exists
      return res.status(200).json({ success: true, message: "If that email exists, a reset link was sent" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // If email transport env is not configured, just log the URL for now
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("Password reset URL:", resetUrl);
      return res.status(200).json({
        success: true,
        message: "Password reset link generated (check server logs during development)",
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Password Reset",
      text: `Reset your password: ${resetUrl}`,
    });

    return res.status(200).json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Reset password using token
const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userModel.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Token is invalid or expired" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Please enter strong password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get current user's profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    const user = await userModel.findById(userId).select("name email role avatar");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    };
    return res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update current user's profile (name, avatar URL) - separate from password
const updateProfile = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const { name, avatar } = req.body;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar || null;
    }

    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    };

    return res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update password separately
const updatePassword = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Current password and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: "Please enter strong password (minimum 8 characters)" });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie("fd_token", { path: "/" });
  return res.status(200).json({ success: true, message: "Logged out" });
};
const googleOAuthCallback = (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Google authentication failed" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    };

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("fd_token", token, cookieOptions);

    const publicCookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("fd_role", user.role || "user", publicCookieOptions);
    res.cookie("fd_user", JSON.stringify(userData), publicCookieOptions);

    const rawOrigins = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    const firstOrigin = rawOrigins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)[0] || "http://localhost:5173";

    const redirectPath = user.role === "admin" ? "/admin" : "/";
    const redirectUrl = `${firstOrigin}${redirectPath}`;

    return res.redirect(redirectUrl);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { loginUser, RegisterUser, promoteToAdmin, forgotPassword, resetPassword, getProfile, updateProfile, updatePassword, logoutUser, googleOAuthCallback };
