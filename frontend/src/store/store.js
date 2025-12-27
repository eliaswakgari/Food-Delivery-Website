import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import foodReducer from "./foodSlice";
import cartReducer from "./cartSlice";
import uiReducer from "./uiSlice";
import socketReducer from "./socketSlice";
import notificationReducer from "./notificationSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    food: foodReducer,
    cart: cartReducer,
    ui: uiReducer,
    socket: socketReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignorePaths: ["socket.socket"],
      },
    }),
});

// Persist auth slice to cookies so refresh does not log the user out
if (typeof window !== "undefined") {
  let previous = store.getState().auth;
  let prevNotifications = store.getState().notifications;
  store.subscribe(() => {
    const current = store.getState().auth;
    if (current === previous) return;
    previous = current;

    const isHttps = window.location.protocol === "https:";
    const sameSite = isHttps ? "None" : "Lax";
    const secureAttr = isHttps ? "; Secure" : "";

    const setCookie = (name, value) => {
      document.cookie = `${name}=${encodeURIComponent(
        value
      )}; path=/; SameSite=${sameSite}${secureAttr}`;
    };
    const clearCookie = (name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=${sameSite}${secureAttr}`;
    };

    const { token, role, user } = current || {};

    if (token) setCookie("fd_token", token);
    else clearCookie("fd_token");

    if (role) setCookie("fd_role", role);
    else clearCookie("fd_role");

    if (user) setCookie("fd_user", JSON.stringify(user));
    else clearCookie("fd_user");
  });

  // Persist notifications (read/unread) to localStorage for consistency across refresh
  store.subscribe(() => {
    const current = store.getState().notifications;
    if (current === prevNotifications) return;
    prevNotifications = current;

    try {
      const items = Array.isArray(current?.items) ? current.items : [];
      window.localStorage.setItem("fd_notifications", JSON.stringify(items.slice(0, 50)));
    } catch {
      // ignore localStorage failures
    }
  });
}

export default store;
