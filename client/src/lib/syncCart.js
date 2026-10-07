import { store } from "../store/store";
import { setCart } from "../store/slices/cartSlice";
import { syncCartApi } from "@/services/cartService";
 

export const syncCartWithServer = async () => {
  // Get the current guest cart from Redux.
  const localCart = store.getState().cart.items;

  // Send the guest cart to the backend.
  const response = await syncCartApi(localCart);

  if (!response.success) {
    throw new Error(response.message || "Failed to synchronize cart.");
  }

  // The server has returned the final authoritative cart.
  // Replace our local Redux cart with that result.
  store.dispatch(setCart(response.cart.items || []));

  return response.cart;
};

/*
  Sync the guest/local cart with the user's database cart.

  This function is called AFTER login/register succeeds.

  Flow:

  1. Get the current cart from Redux.
  2. Send that cart to the backend.
  3. Backend merges it with the user's DB cart.
  4. Backend validates products and stock.
  5. Backend sends back the final/authoritative cart.
  6. Replace Redux cart with the server result.
  7. Our existing store.subscribe() automatically saves
     the updated Redux cart to localStorage.
*/
