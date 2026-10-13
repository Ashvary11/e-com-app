import express from "express";

import {
  cancelOrder,
  createOrder,
  getOrder,
  getOrders,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { orderMutationLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/", authMiddleware, orderMutationLimiter, createOrder);

router.get("/", authMiddleware, getOrders);
router.get("/:orderNumber", authMiddleware, getOrder);

router.patch(
  "/:orderNumber/cancel",
  authMiddleware,
  orderMutationLimiter,
  cancelOrder,
);

export default router;
