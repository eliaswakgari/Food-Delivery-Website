const express = require('express')
const authMiddleware = require('../middleware/auth')
const requireRole = require('../middleware/role')
const { placeOrder, verifyOrder, webhookHandler, adminListOrders, userListOrders, deleteOrder, updateOrderStatus, confirmOrderDelivered } = require('../controllers/orderController')

const orderRouter=express.Router()
orderRouter.post("/place",authMiddleware,placeOrder)
// /verify is called after Stripe redirects back; it does not need auth
orderRouter.get("/verify",verifyOrder)
orderRouter.post("/webhook",webhookHandler)
orderRouter.get("/user-list",authMiddleware,userListOrders)
orderRouter.patch("/user-order/:id/confirm-delivery",authMiddleware,confirmOrderDelivered)

orderRouter.get("/admin-list",authMiddleware,requireRole("admin"),adminListOrders)
orderRouter.patch("/admin-order/:id/status",authMiddleware,requireRole("admin"),updateOrderStatus)
orderRouter.delete("/admin-order/:id",authMiddleware,requireRole("admin"),deleteOrder)

module.exports=orderRouter