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

const initialState = {
  token: (() => getCookie("fd_token") || "")(),
  role: (() => getCookie("fd_role") || "")(),
  user: (() => {
    const raw = getCookie("fd_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })(),
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
    },
    logout(state) {
      state.token = "";
      state.role = "";
      state.user = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
