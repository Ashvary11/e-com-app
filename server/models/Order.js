import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    sku: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    // Will be filled from req.user._id after authentication is added.
    // null for guest orders.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Prevent duplicate order creation on retries/double clicks.
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customer: {
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
    },

    shippingAddress: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      addressLine: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      postalCode: {
        type: String,
        required: true,
        trim: true,
      },

      country: {
        type: String,
        required: true,
        trim: true,
        default: "India",
      },
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shipping: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      default: "razorpay",
    },
    paidAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
