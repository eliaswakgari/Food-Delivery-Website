import { createSlice } from "@reduxjs/toolkit";

// Generic notification item used for both admin and customer
// id: usually the orderId
// role: "admin" | "user"
// read: boolean
// title, dateLabel, status: display fields
const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
  },
  reducers: {
    upsertNotification(state, action) {
      const n = action.payload;
      if (!n || !n.id || !n.role) return;
      const existingIndex = state.items.findIndex((x) => x.id === n.id && x.role === n.role);
      if (existingIndex !== -1) {
        state.items[existingIndex] = { ...state.items[existingIndex], ...n };
      } else {
        state.items.unshift({ ...n, read: n.read ?? false });
        if (state.items.length > 50) state.items.pop();
      }
    },
    markNotificationRead(state, action) {
      const { id, role } = action.payload || {};
      if (!id || !role) return;
      const target = state.items.find((x) => x.id === id && x.role === role);
      if (target) target.read = true;
    },
    markAllReadForRole(state, action) {
      const role = action.payload;
      if (!role) return;
      state.items.forEach((n) => {
        if (n.role === role) n.read = true;
      });
    },
  },
});

export const { upsertNotification, markNotificationRead, markAllReadForRole } = notificationSlice.actions;
export default notificationSlice.reducer;
