import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getMe, logoutUser } from "../../services/authService";

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMe();

      return response.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Not authenticated",
      );
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await logoutUser();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to logout",
      );
    }
  },
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })

      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      .addCase(logout.rejected, (state) => {
        // Even if the server logout fails,
        // remove the user from the frontend.
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export default authSlice.reducer;
