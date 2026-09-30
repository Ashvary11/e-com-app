import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}) => {
    const response = await api.get("/products", {
      params,
    });

    return response.data;
  },
);

const initialState = {
  products: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
  },
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: "products",
  initialState,

  reducers: {
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    clearFilters: (state) => {
      state.filters = {
        search: "",
        category: "",
        minPrice: "",
        maxPrice: "",
        sort: "newest",
      };
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.pagination = action.payload.pagination;
      })

      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { setFilters, clearFilters } = productSlice.actions;

export default productSlice.reducer;
