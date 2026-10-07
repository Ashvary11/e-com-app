import { createSlice } from "@reduxjs/toolkit";

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
