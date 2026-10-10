import { configureStore } from "@reduxjs/toolkit";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";
import authReducer from "./slices/authSlice";
import orderReducer from "./slices/orderSlice";

const savedCart = localStorage.getItem("cartsphere-cart");

export const store = configureStore({
  reducer: {
    products: productReducer,
    cart: cartReducer,
    auth: authReducer,
    orders: orderReducer,
  },
  preloadedState: {
    cart: savedCart ? JSON.parse(savedCart) : undefined,
  },
});
store.subscribe(() => {
  const { auth, cart } = store.getState();
  if (auth.isAuthenticated) {
    return;
  }
  localStorage.setItem("cartsphere-cart", JSON.stringify(cart));
});
