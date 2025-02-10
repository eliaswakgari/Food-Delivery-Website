const Stripe = require('stripe');
const dotenv = require('dotenv').config();
const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
    const frontend_url = "http://localhost:5173";
    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address
        });

        await newOrder.save();

        // Clearing the user's cart after placing the order
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        const line_items = req.body.items.map(item => ({
            price_data: {
                currency: "ETB",
                product_data: {
                    name: item.name
                },
                unit_amount: Math.round(item.price * 100) // Assuming item.price is in ETB
            },
            quantity: item.quantity
        }));

        line_items.push({
            price_data: {
                currency: "ETB",
                product_data: {
                    name: "Delivery Charges"
                },
                unit_amount: Math.round(2 * 100) // Assuming flat ETB 2 for delivery
            },
            quantity: 1
        });

        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            mode: 'payment',
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`
        });

        return res.status(201).json({ success: true, success_url: session.url });
    } catch (error) {
        console.error("Error placing order:", error); // Improved error logging
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { placeOrder };
