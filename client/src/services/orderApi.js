import api from "./api";

export const getOrders = async () => {
  const response = await api.get("/orders");

  return response.data;
};

export const getOrder = async (orderNumber) => {
  const response = await api.get(`/orders/${orderNumber}`);

  return response.data;
};

export const cancelOrder = async (orderNumber, reason) => {
  const response = await api.patch(`/orders/${orderNumber}/cancel`, {
    reason,
  });

  return response.data;
};
