const express = require('express')
const {loginUser,RegisterUser,promoteToAdmin,forgotPassword,resetPassword,getProfile,updateProfile,logoutUser}= require('../controllers/userController.js')

const authMiddleware = require('../middleware/auth')
const userRouter=express.Router()

userRouter.post("/login",loginUser)
userRouter.post("/register",RegisterUser)
// Temporary helper: promote the currently logged-in user to admin
userRouter.post("/make-admin",authMiddleware,promoteToAdmin)
userRouter.post("/forgot-password",forgotPassword)
userRouter.post("/reset-password",resetPassword)
userRouter.get("/me",authMiddleware,getProfile)
userRouter.put("/profile",authMiddleware,updateProfile)
userRouter.post("/logout",authMiddleware,logoutUser)
module.exports=userRouter