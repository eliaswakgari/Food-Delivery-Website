import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";

const Verify = () => {
         const location = useLocation();
         const navigate = useNavigate();
         const token = useSelector((state) => state.auth.token);
         const [status, setStatus] = useState("pending"); // pending | success | failed | error
         const [message, setMessage] = useState("");
         const [order, setOrder] = useState(null);

         useEffect(() => {
                  const params = new URLSearchParams(location.search);
                  const success = params.get("success");
                  const orderId = params.get("orderId");

                  const verifyOrder = async () => {
                           if (!orderId) {
                                    setStatus("error");
                                    setMessage("Missing order ID.");
                                    return;
                           }

                           try {
                                    const response = await axios.get(`${API_BASE_URL}/api/order/verify`, {
                                             params: { success, orderId },
                                             headers: token ? { token } : {},
                                    });

                                    if (response.data.success && success === "true") {
                                             setStatus("success");
                                             setMessage("Payment successful! Your order has been placed.");

                                             // After a successful payment, load this specific order's details
                                             try {
                                                      const ordersRes = await axios.get(`${API_BASE_URL}/api/order/user-list`, {
                                                               withCredentials: true,
                                                      });
                                                      const list = (ordersRes.data && Array.isArray(ordersRes.data.data)) ? ordersRes.data.data : [];
                                                      const found = list.find((o) => o._id === orderId);
                                                      if (found) {
                                                               setOrder(found);
                                                      }
                                             } catch (loadErr) {
                                                      console.error("Failed to load order details after verification", loadErr);
                                             }
                                    } else if (success === "false") {
                                             setStatus("failed");
                                             setMessage("Payment was cancelled or failed.");
                                    } else {
                                             setStatus("error");
                                             setMessage(response.data.message || "Could not verify payment.");
                                    }
                           } catch (err) {
                                    console.error(err);
                                    setStatus("error");
                                    setMessage("Server error while verifying payment.");
                           }
                  };

                  verifyOrder();
         }, [location.search, token]);

         const handleBackToHome = () => {
                  navigate("/");
         };

         const handleViewOrders = () => {
                  navigate("/orders");
         };

         const handleViewOrderDetail = () => {
                  if (order && order._id) {
                           navigate(`/orders/${order._id}`);
                  }
         };

         return (
                  <div style={{ padding: "2rem" }}>
                           {status === "pending" && (
                                    <div style={{ textAlign: "center" }}>
                                             <h2>Verifying your payment...</h2>
                                    </div>
                           )}

                           {status !== "pending" && (
                                    <>
                                             <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                                                      <h2>{message}</h2>
                                             </div>

                                             {status === "success" && order && (
                                                      <div
                                                               style={{
                                                                        maxWidth: "700px",
                                                                        margin: "0 auto 2rem auto",
                                                                        border: "1px solid #e5e7eb",
                                                                        borderRadius: "0.75rem",
                                                                        padding: "1.5rem",
                                                                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                                                               }}
                                                      >
                                                               <h3 style={{ marginBottom: "0.75rem" }}>
                                                                        Order #{order._id && order._id.slice(-6)}
                                                               </h3>
                                                               <p style={{ marginBottom: "0.25rem", color: "#6b7280" }}>
                                                                        Amount: ${order.amount}
                                                               </p>
                                                               <p style={{ marginBottom: "0.75rem", color: "#6b7280" }}>
                                                                        Status: {order.status || "Pending"}
                                                               </p>

                                                               {Array.isArray(order.items) && order.items.length > 0 && (
                                                                        <div>
                                                                                 <h4 style={{ marginBottom: "0.5rem" }}>Items</h4>
                                                                                 <ul style={{ listStyle: "none", padding: 0 }}>
                                                                                          {order.items.map((it, idx) => (
                                                                                                   <li
                                                                                                            key={idx}
                                                                                                            style={{
                                                                                                                     display: "flex",
                                                                                                                     justifyContent: "space-between",
                                                                                                                     padding: "0.25rem 0",
                                                                                                            }}
                                                                                                   >
                                                                                                            <span>{it.name}</span>
                                                                                                            <span>x{it.quantity || 1}</span>
                                                                                                            <span>${Number(it.price || 0).toFixed(2)}</span>
                                                                                                   </li>
                                                                                          ))}
                                                                                 </ul>
                                                                        </div>
                                                               )}
                                                      </div>
                                             )}

                                             <div style={{ textAlign: "center", marginTop: "1rem" }}>
                                                      <button onClick={handleBackToHome} style={{ marginRight: "0.75rem" }}>
                                                               Back to Home
                                                      </button>
                                                      <button onClick={handleViewOrderDetail} style={{ marginRight: "0.75rem" }}>
                                                               View this order in detail
                                                      </button>
                                                      <button onClick={handleViewOrders}>View all my orders</button>
                                             </div>
                                    </>
                           )}
                  </div>
         );
};

export default Verify;
