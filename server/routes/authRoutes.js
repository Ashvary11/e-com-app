import express from "express";

import {
  registerFn,
  loginFn,
  verifyEmailFn,
  resendVerificationFn,
  forgotPasswordFn,
  resetPasswordFn,
  logoutFn,
  logoutAllFn,
  deleteAccountFn,
} from "../controllers/authController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerFn);
router.post("/login", loginFn);

router.post("/verify-email", verifyEmailFn);
router.post("/resend-verification", resendVerificationFn);

router.post("/forgot-password", forgotPasswordFn);
router.post("/reset-password", resetPasswordFn);

router.post("/logout", authMiddleware, logoutFn);
router.post("/logout-all", authMiddleware, logoutAllFn);

router.delete("/account", authMiddleware, deleteAccountFn);

export default router;
