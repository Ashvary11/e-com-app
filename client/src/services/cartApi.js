import api from "./api";

export const mergeCartApi = async (items) => {
  const response = await api.post("/cart/merge-cart", {
    items: items.map((item) => ({
      productId: item._id,
      quantity: item.quantity,
    })),
  });

  return response.data;
};

export const getDbCartApi = async () => {
  const response = await api.get("/cart");
  return response.data;
};

export const updateDbCartApi = async (items) => {
  const response = await api.put("/cart", {
    items: items.map((item) => ({
      productId: item._id,
      quantity: item.quantity,
    })),
  });

  return response.data;
};
