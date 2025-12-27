import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import "./Verify.css";

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
                  <div className="verify-page">
                           <div className="verify-shell">
                                    {status === "pending" && (
                                             <>
                                                      <div className="verify-title">Verifying your payment...</div>
                                                      <div className="verify-subtitle">Please wait a moment.</div>
                                             </>
                                    )}

                                    {status !== "pending" && (
                                             <>
                                                      <div className="verify-title">{message}</div>

                                                      {status === "success" && order && (
                                                               <div className="verify-card">
                                                                        <div className="verify-badge">✓</div>
                                                                        <div className="verify-order-title">Order #{order._id && order._id.slice(-6)}</div>
                                                                        <div className="verify-meta">Amount: ${order.amount}</div>
                                                                        <div className="verify-meta">Status: {order.status || "Pending"}</div>

                                                                        {Array.isArray(order.items) && order.items.length > 0 && (
                                                                                 <div className="verify-items">
                                                                                          <h4>Items</h4>
                                                                                          <ul>
                                                                                                   {order.items.map((it, idx) => (
                                                                                                            <li key={idx}>
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

                                                      <div className="verify-actions">
                                                               <button className="verify-btn" onClick={handleBackToHome}>
                                                                        Back to Home
                                                               </button>
                                                               <button className="verify-btn verify-btn-primary" onClick={handleViewOrderDetail}>
                                                                        View this order
                                                               </button>
                                                               <button className="verify-btn" onClick={handleViewOrders}>
                                                                        View all orders
                                                               </button>
                                                      </div>
                                             </>
                                    )}
                           </div>
                  </div>
         );
};

export default Verify;
