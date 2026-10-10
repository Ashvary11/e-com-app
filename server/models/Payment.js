import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      default: "INR",
    },

    method: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
    },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
      index: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      index: true,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
