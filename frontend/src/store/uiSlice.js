import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: "light",
    searchQuery: "",
    category: "All",
  },
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload === "dark" ? "dark" : "light";
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload || "";
    },
    setCategory(state, action) {
      state.category = action.payload || "All";
    },
  },
});

export const { setTheme, setSearchQuery, setCategory } = uiSlice.actions;
export default uiSlice.reducer;
