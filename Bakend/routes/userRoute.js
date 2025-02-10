const express = require('express')
const {loginUser,RegisterUser}= require('../controllers/userController.js')
const userRouter=express.Router()
userRouter.post("/login",loginUser)
userRouter.post("/register",RegisterUser)
module.exports=userRouter