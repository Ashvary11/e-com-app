import { configureStore } from "@reduxjs/toolkit";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";

const savedCart = localStorage.getItem("cartsphere-cart");

export const store = configureStore({
  reducer: {
    products: productReducer,
    cart: cartReducer,
  },
  preloadedState: {
    cart: savedCart ? JSON.parse(savedCart) : undefined,
  },
});
store.subscribe(() => {
  localStorage.setItem(
    "cartsphere-cart",
    JSON.stringify(store.getState().cart),
  );
});
// authSlice
// cartSlice
// productSlice
// orderSlice
