import React, { useState } from "react";
import "./Login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { setCredentials } from "../../store/authSlice";

const Login = () => {
         const dispatch = useDispatch();
         const navigate = useNavigate();

         const [mode, setMode] = useState("login"); // "login" | "signup"
         const [name, setName] = useState("");
         const [email, setEmail] = useState("");
         const [password, setPassword] = useState("");
         const [loading, setLoading] = useState(false);
         const [error, setError] = useState("");

         const handleSubmit = async (e) => {
                  e.preventDefault();
                  setError("");
                  setLoading(true);

                  try {
                           if (mode === "login") {
                                    const res = await axios.post(
                                             `${API_BASE_URL}/api/user/login`,
                                             { email, password },
                                             { withCredentials: true }
                                    );
                                    if (res.data && res.data.success && res.data.token) {
                                             dispatch(
                                                      setCredentials({
                                                               token: res.data.token,
                                                               role: res.data.role,
                                                               user: res.data.user,
                                                      })
                                             );
                                             if (res.data.role === "admin") {
                                                      navigate("/admin");
                                             } else {
                                                      navigate("/");
                                             }
                                    } else if (res.data && res.data.success === false) {
                                             setError(res.data.message || "Login failed");
                                    } else {
                                             setError("Unexpected response from server");
                                    }
                           } else {
                                    const res = await axios.post(
                                             `${API_BASE_URL}/api/user/register`,
                                             {
                                                      name,
                                                      email,
                                                      password,
                                             },
                                             { withCredentials: true }
                                    );

                                    if (res.data && res.data.success && res.data.token) {
                                             dispatch(
                                                      setCredentials({
                                                               token: res.data.token,
                                                               role: res.data.role,
                                                               user: res.data.user,
                                                      })
                                             );
                                             navigate("/");
                                    } else if (res.data && res.data.success === false) {
                                             setError(res.data.message || "Registration failed");
                                    } else {
                                             setError("Unexpected response from server");
                                    }
                           }
                  } catch (err) {
                           const backendMessage = err?.response?.data?.message;
                           setError(backendMessage || "Server error during authentication");
                  } finally {
                           setLoading(false);
                  }
         };

         const toggleMode = () => {
                  setError("");
                  setMode((prev) => (prev === "login" ? "signup" : "login"));
         };

         return (
                  <div className="auth-container">
                           <form className="auth-form" onSubmit={handleSubmit}>
                                    <h2>{mode === "login" ? "Login" : "Sign Up"}</h2>

                                    {mode === "signup" && (
                                             <input
                                                      type="text"
                                                      placeholder="Name"
                                                      value={name}
                                                      onChange={(e) => setName(e.target.value)}
                                                      required
                                             />
                                    )}

                                    <input
                                             type="email"
                                             placeholder="Email"
                                             value={email}
                                             onChange={(e) => setEmail(e.target.value)}
                                             required
                                    />
                                    <input
                                             type="password"
                                             placeholder="Password"
                                             value={password}
                                             onChange={(e) => setPassword(e.target.value)}
                                             required
                                    />

                                    {error && <p className="auth-error">{error}</p>}

                                    <button type="submit" disabled={loading}>
                                             {loading
                                                      ? mode === "login"
                                                               ? "Logging in..."
                                                               : "Signing up..."
                                                      : mode === "login"
                                                               ? "Login"
                                                               : "Sign Up"}
                                    </button>

                                    <button
                                             type="button"
                                             className="auth-toggle"
                                             onClick={toggleMode}
                                    >
                                             {mode === "login"
                                                      ? "Don't have an account? Sign up"
                                                      : "Already have an account? Login"}
                                    </button>

                                    <button
                                             type="button"
                                             className="auth-forgot"
                                             onClick={() => navigate("/forgot-password")}
                                    >
                                             Forgot password?
                                    </button>

                                    <div className="auth-divider">
                                             <span>OR</span>
                                    </div>

                                    <button
                                             type="button"
                                             className="auth-google"
                                             onClick={() => {
                                                      window.location.href = `${API_BASE_URL}/api/user/auth/google`;
                                             }}
                                    >
                                             Continue with Google
                                    </button>
                           </form>
                  </div>
         );
};

export default Login;
