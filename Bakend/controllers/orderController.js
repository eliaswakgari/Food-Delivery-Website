const Stripe = require('stripe');
const dotenv = require('dotenv').config();
const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const STATUS_SEQUENCE = ["Pending", "Preparing", "Ready", "Delivered"];

const normalizeStatus = (status) => {
    if (!status) return "Pending";
    if (status === "Food Processing") return "Preparing";
    return status;
};

const placeOrder = async (req, res) => {
    const frontend_url = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            status: "Pending",
        });

        await newOrder.save();
        // Safeguard: compute total amount on backend and enforce minimum
        const items = Array.isArray(req.body.items) ? req.body.items : [];

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty. Please add items before proceeding to payment."
            });
        }

        const deliveryFee = 2; // Same as frontend (2 USD delivery fee)

        const subtotal = items.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity) || 0;
            return sum + price * qty;
        }, 0);

        const total = subtotal + deliveryFee;

        // Enforce a reasonable minimum in USD before calling Stripe.
        // Stripe requires at least ~$0.50. We'll require at least $1 total.
        const MIN_TOTAL_USD = 1;

        if (total < MIN_TOTAL_USD) {
            return res.status(400).json({
                success: false,
                message: `Order total ($${total.toFixed(2)}) is too small for payment. Please add more items to your cart.`
            });
        }

        // Convert to smallest currency unit (e.g. cents)
        const totalInMinorUnit = Math.round(total * 100);

        // Debug log so we can see what we send to Stripe
        console.log("Stripe order amounts:", {
            subtotal,
            deliveryFee,
            total,
            totalInMinorUnit
        });

        const line_items = [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "Food order"
                    },
                    unit_amount: totalInMinorUnit // amount in cents
                },
                quantity: 1
            }
        ];

        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            mode: 'payment',
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
            metadata: {
                orderId: newOrder._id.toString(),
                userId: req.body.userId ? req.body.userId.toString() : ""
            }
        });

        return res.status(201).json({ success: true, session_url: session.url });
    } catch (error) {
        console.error("Error placing order:", error); // Improved error logging
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Admin: get a single order
const adminGetOrder = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: "Missing order id" });
    }

    try {
        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order && order.status) {
            const normalized = normalizeStatus(order.status);
            if (normalized !== order.status) {
                order.status = normalized;
            }
        }
        return res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("Error fetching order for admin:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// User: list own orders
const userListOrders = async (req, res) => {
    const userId = req.body.userId;
    if (!userId) {
        return res.status(400).json({ success: false, message: "Missing userId" });
    }

    try {
        const orders = await orderModel.find({ userId }).sort({ date: -1 });
        const normalizedOrders = Array.isArray(orders)
            ? orders.map((o) => {
                if (o && o.status) {
                    const normalized = normalizeStatus(o.status);
                    if (normalized !== o.status) o.status = normalized;
                }
                return o;
            })
            : orders;
        return res.status(200).json({ success: true, data: normalizedOrders });
    } catch (error) {
        console.error("Error listing user orders:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Admin: update order status
const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: "Missing order id" });
    }

    if (!status) {
        return res.status(400).json({ success: false, message: "Missing status" });
    }

    if (!STATUS_SEQUENCE.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Allowed values: ${STATUS_SEQUENCE.join(", ")}`,
        });
    }

    try {
        const order = await orderModel.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const current = normalizeStatus(order.status);
        const target = normalizeStatus(status);
        const currentIndex = STATUS_SEQUENCE.indexOf(current);
        const targetIndex = STATUS_SEQUENCE.indexOf(target);

        if (currentIndex === -1 || targetIndex === -1) {
            return res.status(400).json({
                success: false,
                message: `Invalid order status state. Allowed values: ${STATUS_SEQUENCE.join(", ")}`,
            });
        }

        if (targetIndex < currentIndex) {
            return res.status(400).json({
                success: false,
                message: "Status cannot move backwards",
            });
        }

        if (targetIndex > currentIndex + 1) {
            return res.status(400).json({
                success: false,
                message: `Status must change in sequence. Next allowed status is: ${STATUS_SEQUENCE[currentIndex + 1]}`,
            });
        }

        order.status = target;
        const updated = await order.save();

        // Broadcast status change to all connected clients
        if (req.io) {
            try {
                req.io.emit("order:statusChanged", {
                    orderId: updated._id,
                    userId: updated.userId,
                    status: updated.status,
                });
            } catch (emitErr) {
                console.error("Failed to emit Socket.IO status change event", emitErr);
            }
        }

        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Admin: list all orders
const adminListOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ createdAt: -1 });
        const normalizedOrders = Array.isArray(orders)
            ? orders.map((o) => {
                if (o && o.status) {
                    const normalized = normalizeStatus(o.status);
                    if (normalized !== o.status) o.status = normalized;
                }
                return o;
            })
            : orders;
        return res.status(200).json({ success: true, data: normalizedOrders });
    } catch (error) {
        console.error('Error listing orders for admin:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// User: confirm that an order marked as Ready has been received (sets status to Delivered)
const confirmOrderDelivered = async (req, res) => {
    const { id } = req.params;
    const userId = req.body.userId;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Missing order id' });
    }
    if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    try {
        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized for this order' });
        }

        if (order.status !== 'Ready') {
            return res.status(400).json({ success: false, message: 'Order is not in Ready status' });
        }

        order.status = 'Delivered';
        const updated = await order.save();

        if (req.io) {
            try {
                req.io.emit('order:statusChanged', {
                    orderId: updated._id,
                    userId: updated.userId,
                    status: updated.status,
                });
            } catch (emitErr) {
                console.error('Failed to emit Socket.IO status change event (confirm delivery)', emitErr);
            }
        }

        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Error confirming order delivery:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin: delete order
const deleteOrder = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Order id is required' });
    }

    try {
        const order = await orderModel.findByIdAndDelete(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        return res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const verifyOrder = async (req, res) => {
    const { success, orderId } = req.query;

    if (!orderId) {
        return res.status(400).json({ success: false, message: 'Missing orderId' });
    }

    try {
        if (success === 'true') {
            const existing = await orderModel.findById(orderId);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const wasPaid = !!existing.payment;
            const updated = await orderModel.findByIdAndUpdate(orderId, { payment: true }, { new: true });

            // Clear cart only after successful payment
            try {
                await userModel.findByIdAndUpdate(updated.userId, { cartData: {} });
            } catch (cartErr) {
                console.error("Failed to clear cart after payment", cartErr);
            }

            // Only emit a "new order" once (when it first becomes paid)
            if (!wasPaid && updated && req.io) {
                try {
                    req.io.emit("order:new", {
                        orderId: updated._id,
                        userId: updated.userId,
                        status: updated.status,
                        amount: updated.amount,
                        date: updated.date || new Date(),
                    });
                } catch (emitErr) {
                    console.error("Failed to emit Socket.IO new order event (paid)", emitErr);
                }
            }

            if (updated && req.io) {
                try {
                    req.io.emit("order:paymentUpdated", {
                        orderId: updated._id,
                        userId: updated.userId,
                        payment: true,
                    });
                } catch (emitErr) {
                    console.error("Failed to emit Socket.IO payment update event", emitErr);
                }
            }
            return res.status(200).json({ success: true, message: 'Payment verified and order updated' });
        } else {
            return res.status(200).json({ success: false, message: 'Payment not completed' });
        }
    } catch (error) {
        console.error('Error verifying order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Stripe webhook: used to securely confirm payment from Stripe side
const webhookHandler = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Missing STRIPE_WEBHOOK_SECRET in environment');
        return res.status(500).send('Webhook not configured');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('⚠️  Stripe webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const orderId = session.metadata && session.metadata.orderId;

            if (orderId) {
                const existing = await orderModel.findById(orderId);
                if (!existing) {
                    console.warn('checkout.session.completed received for missing orderId:', orderId);
                    return res.json({ received: true });
                }

                const wasPaid = !!existing.payment;
                const updated = await orderModel.findByIdAndUpdate(orderId, { payment: true }, { new: true });
                console.log('Order marked as paid from webhook:', orderId);

                // Clear cart only after successful payment
                try {
                    await userModel.findByIdAndUpdate(updated.userId, { cartData: {} });
                } catch (cartErr) {
                    console.error("Failed to clear cart after payment (webhook)", cartErr);
                }

                // Only emit a "new order" once (when it first becomes paid)
                if (!wasPaid && updated && req.io) {
                    try {
                        req.io.emit("order:new", {
                            orderId: updated._id,
                            userId: updated.userId,
                            status: updated.status,
                            amount: updated.amount,
                            date: updated.date || new Date(),
                        });
                    } catch (emitErr) {
                        console.error("Failed to emit Socket.IO new order event (webhook paid)", emitErr);
                    }
                }

                if (updated && req.io) {
                    try {
                        req.io.emit("order:paymentUpdated", {
                            orderId: updated._id,
                            userId: updated.userId,
                            payment: true,
                        });
                    } catch (emitErr) {
                        console.error("Failed to emit Socket.IO payment update event (webhook)", emitErr);
                    }
                }
            } else {
                console.warn('checkout.session.completed received without orderId metadata');
            }
        }

        return res.json({ received: true });
    } catch (err) {
        console.error('Error handling Stripe webhook:', err);
        return res.status(500).send('Webhook handler error');
    }
};

module.exports = { placeOrder, verifyOrder, webhookHandler, adminListOrders, userListOrders, deleteOrder, updateOrderStatus, confirmOrderDelivered, adminGetOrder };
