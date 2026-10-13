import express from "express";
import {
  createRazorpayOrder,
  razorpayWebhook,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { paymentLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Payments
router.post("/webhook", razorpayWebhook);
router.post("/verify", authMiddleware, paymentLimiter, verifyRazorpayPayment);
router.post(
  "/:orderNumber",
  authMiddleware,
  paymentLimiter,
  createRazorpayOrder,
);

export default router;
