import express from "express";
import {
  createRazorpayOrder,
  razorpayWebhook,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Payments
router.post("/webhook", razorpayWebhook);
router.post("/verify", authMiddleware, verifyRazorpayPayment);
router.post("/:orderNumber", authMiddleware, createRazorpayOrder);

export default router;
