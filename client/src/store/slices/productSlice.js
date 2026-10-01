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
export const fetchCategories = createAsyncThunk(
  "products/fetchCategories",
  async () => {
    const response = await api.get("/products/categories");

    return response.data;
  },
);
export const fetchPriceRange = createAsyncThunk(
  "products/fetchPriceRange",
  async () => {
    const response = await api.get("/products/price-range");
    return response.data;
  },
);
const initialState = {
  products: [],
  categories: [],
  priceRange: {
    min: 0,
    max: 0,
  },
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
  categoriesLoading: false,
  priceRangeLoading: false,

  error: null,
  categoriesError: null,
  priceRangeError: null,
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
      })

      // Categories
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })

      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload.categories || [];
      })

      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError =
          action.error.message || "Failed to load categories";
      })
      // Price range
      .addCase(fetchPriceRange.pending, (state) => {
        state.priceRangeLoading = true;
        state.priceRangeError = null;
      })

      .addCase(fetchPriceRange.fulfilled, (state, action) => {
        state.priceRangeLoading = false;

        state.priceRange = {
          min: action.payload.minPrice ?? 0,
          max: action.payload.maxPrice ?? 0,
        };
      })
      .addCase(fetchPriceRange.rejected, (state, action) => {
        state.priceRangeLoading = false;
        state.priceRangeError =
          action.error.message || "Failed to load price range";
      });
  },
});

export const { setFilters, clearFilters } = productSlice.actions;

export default productSlice.reducer;
