import api from "./api";

export const syncCartApi = async (items) => {
  const response = await api.post("/cart/sync", {
    items: items.map((item) => ({
      productId: item._id,
      quantity: item.quantity,
    })),
  });

  return response.data;
};


export const updateCartApi = async (items) => {
  const response = await api.put("/cart", {
    items: items.map((item) => ({
      productId: item._id,
      quantity: item.quantity,
    })),
  });

  return response.data;
};
