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

         return (
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                           {status === "pending" && <h2>Verifying your payment...</h2>}
                           {status !== "pending" && <h2>{message}</h2>}
                           {status !== "pending" && (
                                    <button onClick={handleBackToHome} style={{ marginTop: "1rem" }}>
                                             Back to Home
                                    </button>
                           )}
                  </div>
         );
};

export default Verify;
