import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary";

const Home = lazy(() => import("./Pages/Home/Home"));
const Cart = lazy(() => import("./Pages/Cart/Cart"));
const PlaceHolder = lazy(() => import("./Pages/PlaceHolder/PlaceHolder"));
const Orders = lazy(() => import("./Pages/Orders/Orders"));
const Login = lazy(() => import("./Components/Login/Login"));
const Verify = lazy(() => import("./Pages/Verify/Verify"));
const ForgotPassword = lazy(() => import("./Pages/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("./Pages/ResetPassword/ResetPassword"));
const Admin = lazy(() => import("./Pages/Admin/Admin"));
const Settings = lazy(() => import("./Pages/Settings/Settings"));

const ProtectedRoute = ({ children }) => {
         const token = useSelector((state) => state.auth.token);
         if (!token) {
                  return <Navigate to="/login" replace />;
         }
         return children;
};

const AdminRoute = ({ children }) => {
         const token = useSelector((state) => state.auth.token);
         const role = useSelector((state) => state.auth.role);
         if (!token) {
                  return <Navigate to="/login" replace />;
         }
         if (role !== "admin") {
                  return <Navigate to="/" replace />;
         }
         return children;
};

const App = () => {
         const theme = useSelector((state) => state.ui.theme) || "light";
         const appClass = `app theme-${theme}`;
         const location = useLocation();
         const hideChrome = ["/login", "/forgot-password", "/reset-password"].includes(location.pathname);
         return (
                  <div className={appClass}>
                           {!hideChrome && <Navbar />}
                           <ErrorBoundary>
                                    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
                                             <Routes>
                                                      <Route path="/" element={<Home />} />
                                                      <Route
                                                               path="/cart"
                                                               element={
                                                                        <ProtectedRoute>
                                                                                 <Cart />
                                                                        </ProtectedRoute>
                                                               }
                                                      />
                                                      <Route
                                                               path="/order"
                                                               element={
                                                                        <ProtectedRoute>
                                                                                 <PlaceHolder />
                                                                        </ProtectedRoute>
                                                               }
                                                      />
                                                      <Route
                                                               path="/orders"
                                                               element={
                                                                        <ProtectedRoute>
                                                                                 <Orders />
                                                                        </ProtectedRoute>
                                                               }
                                                      />
                                                      <Route path="/login" element={<Login />} />
                                                      <Route path="/verify" element={<Verify />} />
                                                      <Route path="/forgot-password" element={<ForgotPassword />} />
                                                      <Route path="/reset-password" element={<ResetPassword />} />
                                                      <Route
                                                               path="/admin"
                                                               element={
                                                                        <AdminRoute>
                                                                                 <Admin />
                                                                        </AdminRoute>
                                                               }
                                                      />
                                                      <Route
                                                               path="/settings"
                                                               element={
                                                                        <ProtectedRoute>
                                                                                 <Settings />
                                                                        </ProtectedRoute>
                                                               }
                                                      />
                                             </Routes>
                                    </Suspense>
                           </ErrorBoundary>
                           {!hideChrome && <Footer />}
                  </div>
         );
};

export default App;
