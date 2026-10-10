import express from "express";

import {
  cancelOrder,
  createOrder,
  getOrder,
  getOrders,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
 
const router = express.Router();
// Create order
router.post("/", authMiddleware, createOrder);

// User orders
router.get("/", authMiddleware, getOrders);
router.get("/:orderNumber", authMiddleware, getOrder);
router.patch("/:orderNumber/cancel", authMiddleware, cancelOrder);

 

export default router;
