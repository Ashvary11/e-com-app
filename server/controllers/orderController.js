import Order from "../models/Order.js";
import Product from "../models/Product.js";
import {
  cancelUserOrder,
  getUserOrder,
  getUserOrders,
} from "../services/orderService.js";
import { createOrderSchema } from "../validators/orderValidator.js";

const SHIPPING_CHARGE = 0;

const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `CS-${timestamp}-${random}`;
};

const getOrderResponse = (order) => ({
  id: order._id,
  orderNumber: order.orderNumber,
  items: order.items,
  subtotal: order.subtotal,
  shipping: order.shipping,
  total: order.total,
  orderStatus: order.orderStatus,
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod,
  shippingAddress: order.shippingAddress,
  createdAt: order.createdAt,
  paidAt: order.paidAt,
  cancelledAt: order.cancelledAt,
  cancellationReason: order.cancellationReason,
});

export const createOrder = async (req, res) => {
  try {
    const validation = createOrderSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid order details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, items, shippingAddress, idempotencyKey } = validation.data;

    // --------------------------------
    // Idempotency check
    // --------------------------------

    const existingOrder = await Order.findOne({
      idempotencyKey,
    }).lean();

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already created",
        order: getOrderResponse(existingOrder),
      });
    }

    // --------------------------------
    // Prevent duplicate product lines
    // --------------------------------

    const productIds = items.map((item) => item.productId);

    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate product in order",
      });
    }

    // --------------------------------
    // Fetch products from MongoDB
    // --------------------------------

    const products = await Product.find({
      _id: {
        $in: productIds,
      },
      isActive: true,
    })
      .select("name sku price images stock")
      .lean();

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    // --------------------------------
    // Build order items
    // --------------------------------

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "One or more products are no longer available",
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} has only ${product.stock} item${
            product.stock === 1 ? "" : "s"
          } available`,
        });
      }

      // Backend price is authoritative.
      const itemTotal = product.price * item.quantity;

      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        image: product.images?.[0] || "",
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    // --------------------------------
    // Calculate final amount
    // --------------------------------

    const shipping = SHIPPING_CHARGE;
    const total = subtotal + shipping;

    // --------------------------------
    // User
    // --------------------------------
    // Currently guest checkout.
    //
    // After auth:
    // const userId = req.user._id;

    const userId = req.user?.id || null;

    // --------------------------------
    // Create order
    // --------------------------------

    const order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      idempotencyKey,
      customer: {
        email,
      },
      shippingAddress,
      items: orderItems,
      subtotal,
      shipping,
      total,
      orderStatus: "pending",
      paymentStatus: "pending",
      paymentMethod: "razorpay",
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: getOrderResponse(order),
    });
  } catch (error) {
    // --------------------------------
    // Unique index race condition
    // --------------------------------

    if (error?.code === 11000) {
      const existingOrder = await Order.findOne({
        idempotencyKey: req.body?.idempotencyKey,
      }).lean();

      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: "Order already created",
          order: getOrderResponse(existingOrder),
        });
      }
    }

    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await getUserOrders(req.user.id);

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await getUserOrder(req.user.id, orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { reason } = req.body;

    const result = await cancelUserOrder(req.user.id, orderNumber, reason);

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (result.error === "ALREADY_CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    if (result.error === "NOT_CANCELLABLE") {
      return res.status(400).json({
        success: false,
        message: "This order can no longer be cancelled",
      });
    }

    if (result.error === "REFUND_REQUIRED") {
      return res.status(400).json({
        success: false,
        message:
          "This paid order cannot be cancelled until refund processing is available",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: result.order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};
