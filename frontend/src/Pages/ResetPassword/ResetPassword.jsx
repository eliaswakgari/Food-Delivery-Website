import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../store/config";

const ResetPassword = () => {
         const location = useLocation();
         const navigate = useNavigate();

         const [password, setPassword] = useState("");
         const [message, setMessage] = useState("");
         const [error, setError] = useState("");
         const [loading, setLoading] = useState(false);

         const params = new URLSearchParams(location.search);
         const token = params.get("token");
         const email = params.get("email");

         useEffect(() => {
                  if (!token || !email) {
                           setError("Invalid or missing reset link.");
                  }
         }, [token, email]);

         const handleSubmit = async (e) => {
                  e.preventDefault();
                  setMessage("");
                  setError("");
                  setLoading(true);

                  try {
                           const res = await axios.post(`${API_BASE_URL}/api/user/reset-password`, {
                                    token,
                                    email,
                                    password,
                           });

                           if (res.data && res.data.success) {
                                    setMessage(res.data.message || "Password reset successful.");
                                    setTimeout(() => navigate("/login"), 1500);
                           } else {
                                    setError(res.data.message || "Could not reset password.");
                           }
                  } catch (err) {
                           setError("Server error while resetting password.");
                  } finally {
                           setLoading(false);
                  }
         };

         return (
                  <div className="auth-container auth-container-light">
                           <form className="auth-form auth-form-light" onSubmit={handleSubmit}>
                                    <h2>Reset Password</h2>
                                    <input
                                             type="password"
                                             placeholder="New password"
                                             value={password}
                                             onChange={(e) => setPassword(e.target.value)}
                                             required
                                    />
                                    {message && <p>{message}</p>}
                                    {error && <p className="auth-error">{error}</p>}
                                    <button type="submit" disabled={loading || !token || !email}>
                                             {loading ? "Resetting..." : "Reset password"}
                                    </button>
                           </form>
                  </div>
         );
};

export default ResetPassword;
