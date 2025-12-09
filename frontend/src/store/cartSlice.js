import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cartItems: {},
  },
  reducers: {
    addToCart(state, action) {
      const id = action.payload;
      if (!id) return;
      state.cartItems[id] = (state.cartItems[id] || 0) + 1;
    },
    removeFromCart(state, action) {
      const id = action.payload;
      if (!id || !state.cartItems[id]) return;
      if (state.cartItems[id] === 1) {
        delete state.cartItems[id];
      } else {
        state.cartItems[id] -= 1;
      }
    },
    clearCart(state) {
      state.cartItems = {};
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
