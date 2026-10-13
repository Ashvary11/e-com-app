import { randomBytes } from "node:crypto";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import Session from "../models/Session.js";
import Payment from "../models/Payment.js";

// Convert product names into URL-friendly slugs.
const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";

const generateUniqueSlug = async (name) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const generateSku = () => `CS-${randomBytes(4).toString("hex").toUpperCase()}`;

// Normalize manually supplied slugs.
const normalizeProductData = (data) => {
  const normalized = { ...data };

  if (normalized.slug !== undefined) {
    normalized.slug = slugify(normalized.slug);
  }
  return normalized;
};

const handleProductError = (error, res, action) => {
  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];

    const message =
      duplicateField === "sku"
        ? "A product with this SKU already exists"
        : duplicateField === "slug"
          ? "A product with this slug already exists"
          : "A product with these unique values already exists";

    return res.status(409).json({
      success: false,
      message,
      field: duplicateField || undefined,
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  console.error(`${action} error:`, error);

  return res.status(500).json({
    success: false,
    message: action,
  });
};

// List all products, including inactive products.
export const getAdminProducts = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      status = "all",
      sort = "newest",
      page = "1",
      limit = "20",
    } = req.query;

    const filter = {};

    // Include active, inactive, or all products.
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status !== "all") {
      return res.status(400).json({
        success: false,
        message: "Invalid product status",
      });
    }

    if (typeof category === "string" && category.trim()) {
      filter.category = category.trim();
    }

    // Uses the existing MongoDB text index.
    if (typeof search === "string" && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
      nameDesc: { name: -1 },
      category: { category: 1, name: 1 },
      categoryDesc: { category: -1, name: 1 },
      priceLow: { price: 1 },
      priceHigh: { price: -1 },
      stockLow: { stock: 1, name: 1 },
      stockHigh: { stock: -1, name: 1 },
      status: { isActive: -1, name: 1 },
      statusDesc: { isActive: 1, name: 1 },
      rating: { rating: -1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;

    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);

    const perPage = Math.min(
      100,
      Math.max(1, Number.parseInt(limit, 10) || 20),
    );

    const skip = (currentPage - 1) * perPage;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortBy).skip(skip).limit(perPage).lean(),

      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      products,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: currentPage * perPage < total,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    return handleProductError(error, res, "Failed to fetch admin products");
  }
};

// Get one product, including inactive products.
export const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    return handleProductError(error, res, "Failed to fetch product");
  }
};

export const createProduct = async (req, res) => {
  try {
    const data = normalizeProductData(req.body);

    if (!data.slug) {
      data.slug = await generateUniqueSlug(data.name);
    }

    if (!data.sku) {
      data.sku = generateSku();
    }

    const product = await Product.create(data);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    return handleProductError(error, res, "Failed to create product");
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const data = normalizeProductData(req.body);

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: data },
      {
        returnDocument: true,
        runValidators: true,
        context: "query",
      },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return handleProductError(error, res, "Failed to update product");
  }
};

// Activate or deactivate a product.
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      {
        returnDocument: true,
        runValidators: true,
      },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      message: isActive
        ? "Product activated successfully"
        : "Product deactivated successfully",
      product,
    });
  } catch (error) {
    return handleProductError(error, res, "Failed to update product status");
  }
};

//  -------------------- USERS-------------------

export const getAdminUsers = async (req, res) => {
  try {
    const {
      search = "",
      role = "all",
      status = "all",
      sort = "newest",
      page = "1",
      limit = "10",
    } = req.query;

    const allowedRoles = ["user", "manager", "admin"];

    if (role !== "all" && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role filter.",
      });
    }

    const allowedStatuses = ["active", "inactive", "blocked"];

    if (status !== "all" && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status filter.",
      });
    }

    const allowedSorts = ["newest", "oldest", "name-asc", "name-desc"];

    if (!allowedSorts.includes(sort)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sorting option.",
      });
    }

    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(limit, 10) || 10),
    );

    const filter = {};

    if (role !== "all") {
      filter.role = role;
    }

    if (status === "active") {
      filter.isActive = true;
      filter.isBlocked = false;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status === "blocked") {
      filter.isBlocked = true;
    }

    const normalizedSearch = search.trim().slice(0, 100);

    if (normalizedSearch) {
      const escapedSearch = normalizedSearch.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      "name-asc": { name: 1 },
      "name-desc": { name: -1 },
    };

    const skip = (currentPage - 1) * pageSize;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "name email avatar role isEmailVerified isActive isBlocked hasPassword lastLoginAt createdAt",
        )
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(pageSize)
        .lean(),

      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Get admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};

export const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(id)
      .select(
        "name email avatar role isEmailVerified isActive isBlocked hasPassword lastLoginAt passwordChangedAt createdAt updatedAt",
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const activeSessions = await Session.countDocuments({
      userId: user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    return res.status(200).json({
      success: true,
      user,
      activeSessions,
    });
  } catch (error) {
    console.error("Get admin user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user details.",
    });
  }
};

export const updateAdminUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const allowedRoles = ["user", "manager", "admin"];

    if (typeof role !== "string" || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    if (id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === role) {
      return res.status(200).json({
        success: true,
        message: "User already has this role.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    const isActiveAdmin =
      user.role === "admin" && user.isActive && !user.isBlocked;

    if (isActiveAdmin && role !== "admin") {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
        isBlocked: false,
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "You cannot demote the last active administrator.",
        });
      }
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update admin user role error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role.",
    });
  }
};

export const updateAdminUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isBlocked } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const hasIsActive = Object.prototype.hasOwnProperty.call(
      req.body,
      "isActive",
    );
    const hasIsBlocked = Object.prototype.hasOwnProperty.call(
      req.body,
      "isBlocked",
    );

    if (
      (!hasIsActive && !hasIsBlocked) ||
      (hasIsActive && typeof isActive !== "boolean") ||
      (hasIsBlocked && typeof isBlocked !== "boolean") ||
      Object.keys(req.body).some(
        (key) => !["isActive", "isBlocked"].includes(key),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid isActive or isBlocked boolean value.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isSelf = id === req.user.id.toString();

    const nextIsActive = hasIsActive ? isActive : user.isActive;
    const nextIsBlocked = hasIsBlocked ? isBlocked : user.isBlocked;

    if (isSelf && (!nextIsActive || nextIsBlocked)) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate or block your own account.",
      });
    }

    const currentlyActiveAdmin =
      user.role === "admin" && user.isActive && !user.isBlocked;

    const willRemainActiveAdmin =
      user.role === "admin" && nextIsActive && !nextIsBlocked;

    if (currentlyActiveAdmin && !willRemainActiveAdmin) {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
        isBlocked: false,
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot deactivate or block the last active administrator.",
        });
      }
    }

    if (hasIsActive) user.isActive = isActive;
    if (hasIsBlocked) user.isBlocked = isBlocked;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User account status updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error("Update admin user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user account status.",
    });
  }
};

export const revokeAdminUserSessions = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot revoke your own sessions from this action.",
      });
    }

    const user = await User.findById(id).select("_id name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const result = await Session.updateMany(
      {
        userId: user._id,
        revokedAt: null,
      },
      {
        $set: { revokedAt: new Date() },
      },
    );

    return res.status(200).json({
      success: true,
      message: "User sessions revoked successfully.",
      revokedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Revoke admin user sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to revoke user sessions.",
    });
  }
};

// -------------- Order-------------

const ADMIN_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const ADMIN_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

// Only allow forward progress, or cancellation where safe.
// A delivered or cancelled order cannot be reopened.
const ALLOWED_ORDER_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getDateFilter = (dateFrom, dateTo) => {
  const filter = {};

  if (dateFrom) {
    const from = new Date(dateFrom);

    if (Number.isNaN(from.getTime())) {
      return { error: "Invalid dateFrom" };
    }

    from.setUTCHours(0, 0, 0, 0);
    filter.$gte = from;
  }

  if (dateTo) {
    const to = new Date(dateTo);

    if (Number.isNaN(to.getTime())) {
      return { error: "Invalid dateTo" };
    }

    // Include the entire selected UTC calendar day.
    to.setUTCHours(23, 59, 59, 999);
    filter.$lte = to;
  }

  if (filter.$gte && filter.$lte && filter.$gte > filter.$lte) {
    return { error: "dateFrom cannot be after dateTo" };
  }

  return { filter };
};

// GET /admin/orders
export const getAdminOrders = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const {
      search = "",
      orderStatus,
      paymentStatus,
      dateFrom,
      dateTo,
    } = req.query;

    if (orderStatus && !ADMIN_ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    if (paymentStatus && !ADMIN_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const query = {};

    if (orderStatus) query.orderStatus = orderStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (dateFrom || dateTo) {
      const dateResult = getDateFilter(dateFrom, dateTo);

      if (dateResult.error) {
        return res.status(400).json({
          success: false,
          message: dateResult.error,
        });
      }

      query.createdAt = dateResult.filter;
    }

    const normalizedSearch = String(search).trim();

    if (normalizedSearch) {
      const regex = new RegExp(escapeRegex(normalizedSearch), "i");

      query.$or = [
        { orderNumber: regex },
        { "customer.email": regex },
        { "shippingAddress.fullName": regex },
        { "shippingAddress.phone": regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select(
          [
            "orderNumber",
            "userId",
            "customer",
            "shippingAddress.fullName",
            "items",
            "subtotal",
            "shipping",
            "total",
            "orderStatus",
            "paymentStatus",
            "paymentMethod",
            "createdAt",
            "updatedAt",
            "paidAt",
            "cancelledAt",
          ].join(" "),
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get admin orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getAdminOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const payment = await Payment.findOne({
      orderId: order._id,
    })
      .select(
        [
          "amount",
          "currency",
          "method",
          "status",
          "razorpayOrderId",
          "razorpayPaymentId",
          "failureReason",
          "paidAt",
          "refundedAt",
          "createdAt",
          "updatedAt",
        ].join(" "),
      )
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        payment: payment || null,
      },
    });
  } catch (error) {
    console.error("Get admin order details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
    });
  }
};

export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const nextStatus = req.body?.orderStatus;

    if (
      typeof nextStatus !== "string" ||
      !ADMIN_ORDER_STATUSES.includes(nextStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid orderStatus is required",
      });
    }

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const currentStatus = order.orderStatus;

    if (currentStatus === nextStatus) {
      return res.status(400).json({
        success: false,
        message: "Order already has this status",
      });
    }

    const allowedStatuses = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_STATUS_TRANSITION",
        message: `Cannot change order status from ${currentStatus} to ${nextStatus}`,
      });
    }

    // Do not advance fulfillment for an unpaid or failed order.
    // Payment status must be changed only by the payment flow.
    if (nextStatus !== "cancelled" && order.paymentStatus !== "paid") {
      return res.status(409).json({
        success: false,
        code: "PAYMENT_NOT_COMPLETED",
        message: "The order must be paid before fulfillment can continue",
      });
    }

    // Refunds are not implemented. Never cancel a paid order
    // through an order-status update.
    if (nextStatus === "cancelled" && order.paymentStatus === "paid") {
      return res.status(409).json({
        success: false,
        code: "REFUND_REQUIRED",
        message:
          "This paid order cannot be cancelled until refund processing is available",
      });
    }

    const update = {
      orderStatus: nextStatus,
    };

    if (nextStatus === "cancelled") {
      update.cancelledAt = new Date();
      update.cancellationReason = "Cancelled by admin";
    }

    // Compare-and-set prevents overwriting a concurrent status
    // change made after the order was read.
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        orderStatus: currentStatus,
        paymentStatus: order.paymentStatus,
      },
      { $set: update },
      {
        returnDocument: true,
        runValidators: true,
      },
    ).lean();

    if (!updatedOrder) {
      return res.status(409).json({
        success: false,
        code: "ORDER_CHANGED",
        message:
          "The order changed while you were updating it. Refresh and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Update admin order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

const LOW_STOCK_THRESHOLD = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateOnly = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
};

export const getAdminDashboard = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;

    const hasCustomStart = startDate !== undefined;
    const hasCustomEnd = endDate !== undefined;
    const hasCustomRange = hasCustomStart || hasCustomEnd;

    let periodStart;
    let periodEnd;

    if (hasCustomRange) {
      if (!hasCustomStart || !hasCustomEnd) {
        return res.status(400).json({
          success: false,
          message: "Both startDate and endDate are required.",
        });
      }

      const parsedStart = parseDateOnly(startDate);
      const parsedEnd = parseDateOnly(endDate);

      if (!parsedStart || !parsedEnd || parsedStart > parsedEnd) {
        return res.status(400).json({
          success: false,
          message:
            "Provide valid dates with startDate before or equal to endDate.",
        });
      }

      // The end date is inclusive; the query boundary is exclusive.
      periodStart = parsedStart;
      periodEnd = new Date(parsedEnd.getTime() + DAY_MS);
    } else {
      const now = new Date();
      const todayUtc = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );

      const presetDays = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "12m": 365,
      };

      const days = presetDays[range || "30d"];

      if (!days) {
        return res.status(400).json({
          success: false,
          message: "Invalid range. Use 7d, 30d, 90d, 12m, or custom dates.",
        });
      }

      periodEnd = new Date(todayUtc.getTime() + DAY_MS);
      periodStart = new Date(periodEnd.getTime() - days * DAY_MS);
    }

    const periodDuration = periodEnd.getTime() - periodStart.getTime();

    // The comparison period immediately precedes the selected period.
    const previousStart = new Date(periodStart.getTime() - periodDuration);
    const previousEnd = new Date(periodStart);

    const currentPeriodFilter = {
      createdAt: {
        $gte: periodStart,
        $lt: periodEnd,
      },
    };

    const previousPeriodFilter = {
      createdAt: {
        $gte: previousStart,
        $lt: previousEnd,
      },
    };

    // Choose daily buckets for shorter periods and monthly buckets for 12m.
    const useMonthlyBuckets = !hasCustomRange && range === "12m";

    const bucketFormat = useMonthlyBuckets ? "%Y-%m" : "%Y-%m-%d";

    const [
      totalUsers,
      newUsers,
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      cancelledOrders,
      currentOrderMetrics,
      previousOrderMetrics,
      salesTrend,
      orderStatusResults,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments(currentPeriodFilter),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({
        isActive: true,
        stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
      }),
      Product.countDocuments({ stock: 0 }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "pending" }),
      Order.countDocuments({ orderStatus: "cancelled" }),

      Order.aggregate([
        { $match: currentPeriodFilter },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            paidOrders: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0],
              },
            },
            paidRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
              },
            },
          },
        },
      ]),

      Order.aggregate([
        { $match: previousPeriodFilter },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            paidRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
              },
            },
          },
        },
      ]),

      Order.aggregate([
        { $match: currentPeriodFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: bucketFormat,
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            orders: 1,
            revenue: 1,
          },
        },
      ]),

      Order.aggregate([
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
          },
        },
      ]),

      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "orderNumber customer shippingAddress.fullName total createdAt paymentStatus orderStatus",
        )
        .lean(),
    ]);

    const currentMetrics = currentOrderMetrics[0] || {
      orders: 0,
      paidOrders: 0,
      paidRevenue: 0,
    };

    const previousMetrics = previousOrderMetrics[0] || {
      orders: 0,
      paidRevenue: 0,
    };

    // Return zero when the previous period had no activity.
    // A percentage increase from zero has no finite percentage value.
    const getChangePercent = (current, previous) => {
      if (previous === 0) {
        return current === 0 ? 0 : null;
      }

      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const item of orderStatusResults) {
      if (Object.hasOwn(statusCounts, item._id)) {
        statusCounts[item._id] = item.count;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          newUsers,
          totalProducts,
          activeProducts,
          lowStockProducts,
          outOfStockProducts,
          totalOrders,
          periodOrders: currentMetrics.orders,
          paidRevenue: currentMetrics.paidRevenue,
          averageOrderValue:
            currentMetrics.paidOrders > 0
              ? Number(
                  (
                    currentMetrics.paidRevenue / currentMetrics.paidOrders
                  ).toFixed(2),
                )
              : 0,
          pendingOrders,
          cancelledOrders,
        },
        comparison: {
          revenueChangePercent: getChangePercent(
            currentMetrics.paidRevenue,
            previousMetrics.paidRevenue,
          ),
          ordersChangePercent: getChangePercent(
            currentMetrics.orders,
            previousMetrics.orders,
          ),
        },
        salesTrend,
        orderStatus: statusCounts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data.",
    });
  }
};
