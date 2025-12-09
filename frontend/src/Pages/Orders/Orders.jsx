import React, { useEffect, useState } from "react";
import "./Orders.css";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";

const STATUS_STEPS = ["Pending", "Preparing", "Ready", "Delivered"];

const Orders = () => {
         const token = useSelector((state) => state.auth.token);
         const user = useSelector((state) => state.auth.user);
         const socket = useSelector((state) => state.socket.socket);
         const [orders, setOrders] = useState([]);
         const [loading, setLoading] = useState(true);
         const [confirmingId, setConfirmingId] = useState(null);

         useEffect(() => {
                  const fetchOrders = async () => {
                           if (!token) {
                                    setLoading(false);
                                    return;
                           }
                           try {
                                    const res = await axios.get(`${API_BASE_URL}/api/order/user-list`, {
                                             headers: { token },
                                    });
                                    if (res.data && res.data.success && Array.isArray(res.data.data)) {
                                             setOrders(res.data.data);
                                    }
                           } catch (err) {
                                    console.error("Failed to load user orders", err);
                           } finally {
                                    setLoading(false);
                           }
                  };

                  fetchOrders();
         }, [token]);

         useEffect(() => {
                  if (!socket || !user || !user._id) return;

                  const handleStatusChanged = (payload) => {
                           if (!payload || payload.userId !== user._id) return;
                           setOrders((prev) =>
                                    prev.map((o) => (o._id === payload.orderId ? { ...o, status: payload.status } : o))
                           );
                  };

                  socket.on("order:statusChanged", handleStatusChanged);

                  return () => {
                           socket.off("order:statusChanged", handleStatusChanged);
                  };
         }, [socket, user]);

         const renderTimeline = (status) => {
                  const currentIndex = STATUS_STEPS.indexOf(status || "Pending");
                  return (
                           <div className="orders-timeline">
                                    {STATUS_STEPS.map((step, idx) => {
                                             const reached = idx <= currentIndex;
                                             return (
                                                      <div key={step} className="orders-timeline-step">
                                                               <div className={`orders-timeline-dot ${reached ? "orders-timeline-dot-active" : ""}`} />
                                                               <span className={`orders-timeline-label ${reached ? "orders-timeline-label-active" : ""}`}>
                                                                        {step}
                                                               </span>
                                                               {idx < STATUS_STEPS.length - 1 && (
                                                                        <div className={`orders-timeline-bar ${idx < currentIndex ? "orders-timeline-bar-active" : ""}`} />
                                                               )}
                                                      </div>
                                             );
                                    })}
                           </div>
                  );
         };

         const handleConfirmDelivery = async (orderId) => {
                  if (!token) return;
                  setConfirmingId(orderId);
                  try {
                           const res = await axios.patch(
                                    `${API_BASE_URL}/api/order/user-order/${orderId}/confirm-delivery`,
                                    {},
                                    { headers: { token } }
                           );
                           if (res.data && res.data.success && res.data.data) {
                                    const updated = res.data.data;
                                    setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, status: updated.status } : o)));
                           }
                  } catch (err) {
                           console.error("Failed to confirm delivery", err);
                  } finally {
                           setConfirmingId(null);
                  }
         };

         return (
                  <div className="orders-page">
                           <h1>My Orders</h1>
                           {loading && <p>Loading your orders...</p>}
                           {!loading && orders.length === 0 && <p>You have no previous orders yet.</p>}

                           <div className="orders-list">
                                    {orders.map((order) => {
                                             const date = new Date(order.date || order.createdAt);
                                             const isReady = (order.status || "Pending") === "Ready";
                                             const isDelivered = (order.status || "Pending") === "Delivered";
                                             return (
                                                      <div key={order._id} className="orders-card">
                                                               <div className="orders-card-header">
                                                                        <div>
                                                                                 <p className="orders-card-title">Order #{order._id.slice(-6)}</p>
                                                                                 <p className="orders-card-meta">
                                                                                          {date.toLocaleDateString()} • ${order.amount?.toFixed?.(2) || order.amount}
                                                                                 </p>
                                                                        </div>
                                                                        <div className="orders-card-status">{order.status || "Pending"}</div>
                                                               </div>

                                                               {renderTimeline(order.status)}

                                                               {isReady && !isDelivered && (
                                                                        <div className="orders-ready-alert">
                                                                                 <p>Your order is ready. Please pick it up!</p>
                                                                                 <button
                                                                                          type="button"
                                                                                          className="orders-confirm-btn"
                                                                                          onClick={() => handleConfirmDelivery(order._id)}
                                                                                          disabled={confirmingId === order._id}
                                                                                 >
                                                                                          {confirmingId === order._id ? "Confirming..." : "I received my order"}
                                                                                 </button>
                                                                        </div>
                                                               )}

                                                               <div className="orders-items">
                                                                        {Array.isArray(order.items) &&
                                                                                 order.items.map((it, idx) => (
                                                                                          <div key={idx} className="orders-item-row">
                                                                                                   <span>{it.name}</span>
                                                                                                   <span>x{it.quantity || 1}</span>
                                                                                                   <span>${Number(it.price || 0).toFixed(2)}</span>
                                                                                          </div>
                                                                                 ))}
                                                               </div>
                                                      </div>
                                             );
                                    })}
                           </div>
                  </div>
         );
};

export default Orders;
