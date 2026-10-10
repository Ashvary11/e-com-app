import Order from "../models/Order.js";

export const getUserOrders = async (userId) => {
  return Order.find({ userId })
    .sort({ createdAt: -1 })
    .select(
      "orderNumber items subtotal shipping total orderStatus paymentStatus paymentMethod createdAt",
    )
    .lean();
};

export const getUserOrder = async (userId, orderNumber) => {
  return Order.findOne({
    userId,
    orderNumber,
  }).lean();
};

export const cancelUserOrder = async (
  userId,
  orderNumber,
  cancellationReason,
) => {
  const order = await Order.findOne({
    userId,
    orderNumber,
  });

  if (!order) {
    return {
      error: "NOT_FOUND",
    };
  }

  if (order.orderStatus === "cancelled") {
    return {
      error: "ALREADY_CANCELLED",
    };
  }

  const cancellableStatuses = ["pending", "confirmed"];

  if (!cancellableStatuses.includes(order.orderStatus)) {
    return {
      error: "NOT_CANCELLABLE",
    };
  }

  // A paid online order will eventually require a Razorpay refund.
  // Payment/refund handling will be added with the payment gateway.
  if (order.paymentMethod === "razorpay" && order.paymentStatus === "paid") {
    return {
      error: "REFUND_REQUIRED",
    };
  }

  order.orderStatus = "cancelled";
  order.cancelledAt = new Date();
  order.cancellationReason =
    cancellationReason?.trim() || "Cancelled by customer";

  await order.save();

  return {
    order,
  };
};
