import { randomBytes } from "node:crypto";
import Product from "../models/Product.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import Session from "../models/Session.js";

// Convert product names into URL-friendly slugs.
const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";

// Generate a unique slug when one is not provided.
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

// Generate a SKU when one is not provided.
const generateSku = () => `CS-${randomBytes(4).toString("hex").toUpperCase()}`;

// Normalize manually supplied slugs.
const normalizeProductData = (data) => {
  const normalized = { ...data };

  if (normalized.slug !== undefined) {
    normalized.slug = slugify(normalized.slug);
  }

  return normalized;
};

// Handle duplicate unique-index errors from MongoDB.
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

// GET /api/admin/products
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

// GET /api/admin/products/:id
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

// POST /api/admin/products
// Create a new product.
export const createProduct = async (req, res) => {
  try {
    const data = normalizeProductData(req.body);

    // Generate missing values without changing the schema.
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

// PATCH /api/admin/products/:id
// Update editable product fields.
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

    // Do not change the slug automatically when the name changes.
    // Existing product URLs remain stable unless the slug is supplied.

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: data },
      {
        new: true,
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

// PATCH /api/admin/products/:id/status
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
        new: true,
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

//  -------------------- USers-------------------

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

    // Validate role filter.
    const allowedRoles = ["user", "manager", "admin"];

    if (role !== "all" && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role filter.",
      });
    }

    // Validate account status filter.
    const allowedStatuses = ["active", "inactive", "blocked"];

    if (status !== "all" && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status filter.",
      });
    }

    // Validate sorting.
    const allowedSorts = ["newest", "oldest", "name-asc", "name-desc"];

    if (!allowedSorts.includes(sort)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sorting option.",
      });
    }

    // Normalize pagination values.
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

    // Escape user input before using it in a regular expression.
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
// GET /api/admin/users/:id
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

// PATCH /api/admin/users/:id/role
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

// PATCH /api/admin/users/:id/status
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

// POST /api/admin/users/:id/revoke-sessions
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
