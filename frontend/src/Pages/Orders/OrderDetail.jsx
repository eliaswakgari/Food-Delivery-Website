import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import "./Orders.css";

const OrderDetail = () => {
         const { id } = useParams();
         const token = useSelector((state) => state.auth.token);
         const [order, setOrder] = useState(null);
         const [loading, setLoading] = useState(true);
         const [error, setError] = useState("");
         const navigate = useNavigate();

         useEffect(() => {
                  const loadOrder = async () => {
                           if (!token) {
                                    setLoading(false);
                                    setError("You must be logged in to view this order.");
                                    return;
                           }
                           try {
                                    const res = await axios.get(`${API_BASE_URL}/api/order/user-list`, {
                                             withCredentials: true,
                                    });
                                    const list = res.data && Array.isArray(res.data.data) ? res.data.data : [];
                                    const found = list.find((o) => o._id === id);
                                    if (!found) {
                                             setError("Order not found.");
                                    } else {
                                             setOrder(found);
                                    }
                           } catch (err) {
                                    console.error("Failed to load order detail", err);
                                    setError("Server error while loading order.");
                           } finally {
                                    setLoading(false);
                           }
                  };

                  loadOrder();
         }, [id, token]);

         const handleBackToOrders = () => {
                  navigate("/orders");
         };

         if (loading) {
                  return (
                           <div className="orders-page">
                                    <h1>Order Details</h1>
                                    <p>Loading order...</p>
                           </div>
                  );
         }

         if (error || !order) {
                  return (
                           <div className="orders-page">
                                    <h1>Order Details</h1>
                                    <p>{error || "Order not found."}</p>
                                    <button onClick={handleBackToOrders} style={{ marginTop: "1rem" }}>
                                             Back to my orders
                                    </button>
                           </div>
                  );
         }

         const date = new Date(order.date || order.createdAt);

         return (
                  <div className="orders-page">
                           <h1>Order Details</h1>
                           <div className="orders-card" style={{ maxWidth: "720px", margin: "1rem auto" }}>
                                    <div className="orders-card-header">
                                             <div>
                                                      <p className="orders-card-title">Order #{order._id.slice(-6)}</p>
                                                      <p className="orders-card-meta">
                                                               {date.toLocaleDateString()} • ${order.amount?.toFixed?.(2) || order.amount}
                                                      </p>
                                             </div>
                                             <div className="orders-card-status">{order.status || "Pending"}</div>
                                    </div>

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

                           <div style={{ textAlign: "center", marginTop: "1rem" }}>
                                    <button onClick={handleBackToOrders}>Back to my orders</button>
                           </div>
                  </div>
         );
};

export default OrderDetail;
