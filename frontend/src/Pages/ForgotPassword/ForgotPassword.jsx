import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../store/config";

const ForgotPassword = () => {
         const [email, setEmail] = useState("");
         const [message, setMessage] = useState("");
         const [error, setError] = useState("");
         const [loading, setLoading] = useState(false);

         const handleSubmit = async (e) => {
                  e.preventDefault();
                  setMessage("");
                  setError("");
                  setLoading(true);

                  try {
                           const res = await axios.post(`${API_BASE_URL}/api/user/forgot-password`, { email });
                           if (res.data && res.data.success) {
                                    setMessage(res.data.message || "If that email exists, a reset link was sent.");
                           } else {
                                    setError(res.data.message || "Could not start password reset.");
                           }
                  } catch (err) {
                           setError("Server error while requesting password reset.");
                  } finally {
                           setLoading(false);
                  }
         };

         return (
                  <div className="auth-container">
                           <form className="auth-form" onSubmit={handleSubmit}>
                                    <h2>Forgot Password</h2>
                                    <input
                                             type="email"
                                             placeholder="Your email"
                                             value={email}
                                             onChange={(e) => setEmail(e.target.value)}
                                             required
                                    />
                                    {message && <p>{message}</p>}
                                    {error && <p className="auth-error">{error}</p>}
                                    <button type="submit" disabled={loading}>
                                             {loading ? "Sending..." : "Send reset link"}
                                    </button>
                           </form>
                  </div>
         );
};

export default ForgotPassword;
