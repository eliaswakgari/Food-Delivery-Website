import { createSlice } from "@reduxjs/toolkit";

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] || "");
};

// Read from non-httpOnly cookies (set by the frontend) for fast bootstrap.
// If there is no token cookie, we start in a "loading" state so AuthBootstrap
// can ask the backend (/api/user/me) whether the user is authenticated.
const initialToken = getCookie("fd_token") || "";
const initialRole = getCookie("fd_role") || "";
const initialUser = (() => {
  const raw = getCookie("fd_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
})();

const initialState = {
  token: initialToken,
  role: initialRole,
  user: initialUser,
  // While we don't know yet whether the user is authenticated, we keep
  // loading=true. Route guards will wait for this to be false before
  // deciding to redirect to /login.
  loading: !initialToken,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { token, role, user } = action.payload || {};
      if (typeof token !== "undefined") state.token = token;
      if (typeof role !== "undefined") state.role = role;
      if (typeof user !== "undefined") state.user = user;
      state.loading = false;
    },
    // Explicitly mark auth bootstrap as finished (used when backend says
    // the user is not logged in, or when the profile load fails).
    setAuthLoaded(state) {
      state.loading = false;
    },
    logout(state) {
      state.token = "";
      state.role = "";
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setCredentials, setAuthLoaded, logout } = authSlice.actions;
export default authSlice.reducer;
