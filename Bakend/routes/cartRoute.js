const express = require('express')
const { addToCart, removeFromCart, getCart } = require('../controllers/cartControler')
const authMiddleware = require('../middleware/auth')
const cartRouter=express.Router()
cartRouter.post("/add",authMiddleware,addToCart)
cartRouter.post("remove",authMiddleware,removeFromCart)
cartRouter.get("/get",authMiddleware,getCart)
module.exports=cartRouter