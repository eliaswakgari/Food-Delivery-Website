const express = require('express')
const passport = require('../config/passport')
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {loginUser,RegisterUser,promoteToAdmin,forgotPassword,resetPassword,getProfile,updateProfile,updatePassword,logoutUser,googleOAuthCallback}= require('../controllers/userController.js')

const authMiddleware = require('../middleware/auth')
const userRouter=express.Router()

// Local avatar uploads (stored in Bakend/uploads and served via /images)
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 10 ? ext : ".png";
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const uploadAvatar = multer({ storage: avatarStorage });

userRouter.post("/login",loginUser)
userRouter.post("/register",RegisterUser)
userRouter.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }))
userRouter.get("/auth/google/callback", passport.authenticate('google', { session: false, failureRedirect: '/api/user/auth/google/failure' }), googleOAuthCallback)
userRouter.get("/auth/google/failure", (req, res) => {
  return res.status(401).json({ success: false, message: 'Google authentication failed' })
})

// Temporary helper: promote the currently logged-in user to admin
userRouter.post("/make-admin",authMiddleware,promoteToAdmin)
userRouter.post("/forgot-password",forgotPassword)
userRouter.post("/reset-password",resetPassword)
userRouter.get("/me",authMiddleware,getProfile)
userRouter.put("/profile",authMiddleware,updateProfile)
userRouter.post("/avatar", authMiddleware, uploadAvatar.single("avatar"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No avatar file uploaded" });
  }
  return res.status(200).json({ success: true, avatar: `/images/${req.file.filename}` });
});
userRouter.put("/password",authMiddleware,updatePassword)
userRouter.post("/logout",authMiddleware,logoutUser)
module.exports=userRouter