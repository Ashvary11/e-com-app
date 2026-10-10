import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getDbCartApi,
  mergeCartApi,
  updateDbCartApi,
} from "../../services/cartApi.js";

export const fetchDbCart = createAsyncThunk(
  "cart/fetchDbCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDbCartApi();

      if (!response.success) {
        throw new Error(response.message || "Failed to load cart.");
      }

      return response.cart.items || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const mergeGuestCart = createAsyncThunk(
  "cart/mergeGuestCart",
  async (_, { getState, rejectWithValue }) => {
    try {
      const guestItems = getState().cart.items;

      // No guest items: just load the existing database cart.
      if (guestItems.length === 0) {
        const response = await getDbCartApi();

        if (!response.success) {
          throw new Error(response.message || "Failed to load cart.");
        }

        return response.cart.items || [];
      }

      const response = await mergeCartApi(guestItems);

      if (!response.success) {
        throw new Error(response.message || "Failed to merge cart.");
      }

      // Remove the guest cart only after a successful merge.
      localStorage.removeItem("cartsphere-cart");

      return response.cart.items || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateDbCart = createAsyncThunk(
  "cart/updateDbCart",
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await updateDbCartApi(getState().cart.items);

      if (!response.success) {
        throw new Error(response.message || "Failed to update cart.");
      }

      return response.cart.items || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

let updateTimer;

export const scheduleDbCartUpdate = () => (dispatch, getState) => {
  clearTimeout(updateTimer);

  updateTimer = setTimeout(() => {
    if (!getState().auth.isAuthenticated) return;

    dispatch(updateDbCart())
      .unwrap()
      .then(() => {
        console.log("Cart updated in database");
      })
      .catch((error) => {
        console.error("Cart database update failed:", error);
      });
  }, 500);
};

const initialState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find((item) => item._id === product._id);

      if (existingItem) {
        existingItem.quantity = Math.min(
          existingItem.quantity + product.quantity,
          existingItem.stock,
        );
      } else {
        state.items.push({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images || [],
          stock: product.stock,
          quantity: product.quantity,
        });
      }
    },

    increaseQuantity: (state, action) => {
      const item = state.items.find((item) => item._id === action.payload);

      if (item && item.quantity < item.stock) {
        item.quantity += 1;
      }
    },

    decreaseQuantity: (state, action) => {
      const item = state.items.find((item) => item._id === action.payload);

      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
    },

    clearCart: (state) => {
      state.items = [];
    },

    setCart: (state, action) => {
      state.items = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchDbCart.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(mergeGuestCart.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(updateDbCart.fulfilled, (state, action) => {
        state.items = action.payload;
      })

      // Clear Redux cart on logout without touching MongoDB.
      .addMatcher(
        (action) =>
          action.type === "auth/logout/fulfilled" ||
          action.type === "auth/logout/rejected",
        (state) => {
          state.items = [];
        },
      );
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  setCart,
} = cartSlice.actions;

export default cartSlice.reducer;
