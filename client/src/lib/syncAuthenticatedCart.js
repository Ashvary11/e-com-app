import { store } from "../store/store";
import { setCart } from "../store/slices/cartSlice";
import { updateCartApi } from "../services/cartService";

let syncTimer = null;

export const syncAuthenticatedCart = () => {
 
  clearTimeout(syncTimer); 
  // Wait 1000ms after the user's last cart change.
  syncTimer = setTimeout(async () => {
    try {
      
      const state = store.getState();

      if (!state.auth.isAuthenticated) {
        return;
      }

      // Get the latest cart.
      const items = state.cart.items;

      // Send the final cart to the server.
      const response = await updateCartApi(items);

      // Server is authoritative.
      store.dispatch(
        setCart(response.cart.items || []),
      );
    } catch (error) {
      console.error(
        "Authenticated cart sync failed:",
        error,
      );
    }
  }, 1000);
};