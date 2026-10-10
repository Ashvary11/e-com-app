import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getOrders, getOrder, cancelOrder } from "@/services/orderApi";

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getOrders();

      return data.orders;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders",
      );
    }
  },
);

export const fetchOrder = createAsyncThunk(
  "orders/fetchOrder",
  async (orderNumber, { rejectWithValue }) => {
    try {
      const data = await getOrder(orderNumber);

      return data.order;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order",
      );
    }
  },
);

export const cancelOrderByNumber = createAsyncThunk(
  "orders/cancelOrder",
  async ({ orderNumber, reason }, { rejectWithValue }) => {
    try {
      const data = await cancelOrder(orderNumber, reason);

      return data.order;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel order",
      );
    }
  },
);

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },

    clearOrderError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })

      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch single order
      .addCase(fetchOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentOrder = null;
      })

      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })

      .addCase(fetchOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Cancel order
      .addCase(cancelOrderByNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(cancelOrderByNumber.fulfilled, (state, action) => {
        state.loading = false;

        const cancelledOrder = action.payload;

        state.currentOrder = cancelledOrder;

        const index = state.orders.findIndex(
          (order) => order.orderNumber === cancelledOrder.orderNumber,
        );

        if (index !== -1) {
          state.orders[index] = cancelledOrder;
        }
      })

      .addCase(cancelOrderByNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentOrder, clearOrderError } = orderSlice.actions;

export default orderSlice.reducer;
