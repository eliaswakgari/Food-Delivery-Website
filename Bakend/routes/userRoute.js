const express = require('express')
const passport = require('../config/passport')
const {loginUser,RegisterUser,promoteToAdmin,forgotPassword,resetPassword,getProfile,updateProfile,logoutUser,googleOAuthCallback}= require('../controllers/userController.js')

const authMiddleware = require('../middleware/auth')
const userRouter=express.Router()

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
userRouter.post("/logout",authMiddleware,logoutUser)
module.exports=userRouter