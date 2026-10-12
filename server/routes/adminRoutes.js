import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAuthorizedRole } from "../middleware/roleMiddleware.js";

import {
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  getAdminUsers,
  getAdminUserById,
  updateAdminUserRole,
  updateAdminUserStatus,
  revokeAdminUserSessions,
} from "../controllers/adminController.js";

const router = express.Router();

// Protect every admin endpoint.
router.use(authMiddleware, isAuthorizedRole(["admin"]));

// Product inventory and categories.

router.get("/products", getAdminProducts);
router.get("/products/:id", getAdminProductById);

// Create and update products.
router.post("/products", createProduct);
router.patch("/products/:id", updateProduct);
router.patch("/products/:id/status", updateProductStatus);

// users

// User management
router.get("/users", getAdminUsers);
router.get("/users/:id", getAdminUserById);
router.patch("/users/:id/role", updateAdminUserRole);
router.patch("/users/:id/status", updateAdminUserStatus);
router.post("/users/:id/revoke-sessions", revokeAdminUserSessions);

export default router;
