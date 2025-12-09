import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "./config";

export const fetchFood = createAsyncThunk("food/fetchFood", async () => {
  const res = await axios.get(`${API_BASE_URL}/api/food/list`);
  if (res.data && res.data.success && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return [];
});

const foodSlice = createSlice({
  name: "food",
  initialState: {
    food_list: [],
    status: "idle",
    error: null,
  },
  reducers: {
    setFoodList(state, action) {
      state.food_list = Array.isArray(action.payload) ? action.payload : [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFood.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFood.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.food_list = action.payload || [];
      })
      .addCase(fetchFood.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error?.message || "Failed to load food list";
      });
  },
});

export const { setFoodList } = foodSlice.actions;
export default foodSlice.reducer;
