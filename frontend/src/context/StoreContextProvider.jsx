import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

export const StoreContext = createContext();

const StoreContextProvider = ({ children }) => {
         const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
         const socketUrl = import.meta.env.VITE_SOCKET_URL || url;

         const [food_list, setFoodList] = useState([]);
         const [cartItems, setCartItems] = useState({});

         const getCookie = (name) => {
                  if (typeof document === "undefined") return null;
                  const match = document.cookie
                           .split(";")
                           .map((c) => c.trim())
                           .find((c) => c.startsWith(name + "="));
                  if (!match) return null;
                  return decodeURIComponent(match.split("=")[1] || "");
         };

         const [token, setToken] = useState(() => {
                  const value = getCookie("fd_token");
                  return value || "";
         });

         const [role, setRole] = useState(() => {
                  const value = getCookie("fd_role");
                  return value || "";
         });

         const [user, setUser] = useState(() => {
                  const raw = getCookie("fd_user");
                  if (!raw) return null;
                  try {
                           return JSON.parse(raw);
                  } catch {
                           return null;
                  }
         });
         const [theme, setTheme] = useState("light");
         const [socket, setSocket] = useState(null);
         const [searchQuery, setSearchQuery] = useState("");

         const addToCart = (id) => {
                  if (role === "admin") {
                           alert("Admin cannot order items only permitted to customers");
                           return;
                  }
                  setCartItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
         };

         const removeFromCart = (id) => {
                  setCartItems((prev) => {
                           if (!prev[id]) return prev;
                           const updated = { ...prev };
                           if (updated[id] === 1) {
                                    delete updated[id];
                           } else {
                                    updated[id] -= 1;
                           }
                           return updated;
                  });
         };

         const getTotalCartAmount = () => {
                  let total = 0;
                  for (const id in cartItems) {
                           const item = food_list.find((f) => f._id === id);
                           if (item) {
                                    total += item.price * cartItems[id];
                           }
                  }
                  return total;
         };

         useEffect(() => {
                  const fetchFood = async () => {
                           try {
                                    const res = await axios.get(`${url}/api/food/list`);
                                    if (res.data && res.data.success && Array.isArray(res.data.data)) {
                                             setFoodList(res.data.data);
                                    }
                           } catch (err) {
                                    console.error("Failed to load food list", err);
                           }
                  };

                  fetchFood();
         }, [url]);

         // Persist auth to cookies so refresh does not log the user out
         useEffect(() => {
                  if (typeof document === "undefined") return;

                  const setCookie = (name, value) => {
                           // simple cookie, path=/ so it's available across the app
                           document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
                  };

                  const clearCookie = (name) => {
                           document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                  };

                  if (token) {
                           setCookie("fd_token", token);
                  } else {
                           clearCookie("fd_token");
                  }

                  if (role) {
                           setCookie("fd_role", role);
                  } else {
                           clearCookie("fd_role");
                  }

                  if (user) {
                           setCookie("fd_user", JSON.stringify(user));
                  } else {
                           clearCookie("fd_user");
                  }
         }, [token, role, user]);

         useEffect(() => {
                  const s = io(socketUrl, {
                           withCredentials: true,
                  });
                  setSocket(s);

                  return () => {
                           s.disconnect();
                  };
         }, [socketUrl]);

         const value = {
                  url,
                  socket,
                  token,
                  setToken,
                  role,
                  setRole,
                  user,
                  setUser,
                  theme,
                  setTheme,
                  food_list,
                  setFoodList,
                  cartItems,
                  addToCart,
                  removeFromCart,
                  getTotalCartAmount,
         };

         return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export default StoreContextProvider;
