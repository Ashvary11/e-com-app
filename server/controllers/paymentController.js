import crypto from "crypto";
import { RAZORPAY } from "../config/razorpayConfig.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";

export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "userId not found",
      });
    }
    const order = await Order.findOne({
      orderNumber,
      userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled order cannot be paid",
      });
    }

    // Reuse an existing payment for this order.
    const existingPayment = await Payment.findOne({
      orderId: order._id,
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Payment already created",
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: existingPayment.razorpayOrderId,
        amount: Math.round(existingPayment.amount * 100),
        currency: existingPayment.currency,
        orderNumber: order.orderNumber,
      });
    }

    const razorpayOrder = await RAZORPAY.orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order.orderNumber,
    });

    const payment = await Payment.create({
      orderId: order._id,
      userId,
      amount: order.total,
      currency: "INR",
      method: "razorpay",
      status: "created",
      razorpayOrderId: razorpayOrder.id,
    });

    return res.status(201).json({
      success: true,
      message: "Payment created",
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: payment.razorpayOrderId,
      amount: Math.round(payment.amount * 100),
      currency: payment.currency,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderNumber,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const userId = req.user.id;

    if (
      !orderNumber ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    const order = await Order.findOne({
      orderNumber,
      userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const payment = await Payment.findOne({
      orderId: order._id,
      razorpayOrderId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        orderNumber: order.orderNumber,
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      payment.status = "failed";
      payment.failureReason = "Payment signature verification failed";

      await payment.save();

      order.paymentStatus = "failed";

      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.paidAt = new Date();

    await payment.save();

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paidAt = payment.paidAt;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({
        success: false,
        message: "Webhook configuration error",
      });
    }

    if (!req.rawBody) {
      console.error("Webhook raw body is missing");
      return res.status(400).json({
        success: false,
        message: "Invalid webhook request",
      });
    }

    const receivedSignature = req.headers["x-razorpay-signature"];

    if (!receivedSignature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature is missing",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex");

    if (expectedSignature !== receivedSignature) {
      console.error("Invalid Razorpay webhook signature");

      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body?.event;

    if (event !== "payment.captured") {
      return res.status(200).json({
        success: true,
        message: "Webhook event ignored",
      });
    }

    const paymentEntity = req.body?.payload?.payment?.entity;

    if (!paymentEntity) {
      return res.status(400).json({
        success: false,
        message: "Payment data is missing",
      });
    }

    const { order_id: razorpayOrderId, id: razorpayPaymentId } = paymentEntity;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment identifiers are missing",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId,
    });

    if (!payment) {
      console.warn(`Payment not found for Razorpay order: ${razorpayOrderId}`);

      return res.status(200).json({
        success: true,
        message: "Payment record not found",
      });
    }

    // Webhooks can be delivered more than once.
    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
      });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.paidAt = new Date();

    await payment.save();

    const order = await Order.findById(payment.orderId);

    if (!order) {
      console.error(`Order not found: ${payment.orderId}`);

      return res.status(200).json({
        success: true,
        message: "Payment processed but order not found",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paidAt = payment.paidAt;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment webhook processed successfully",
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
