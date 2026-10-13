import express from "express";

import {
  registerEmailUser,
  verifyEmail,
  resendEmailOtp,
  emailLogin,
  forgotPassword,
  resetPassword,
  logout,
  logoutFromEverywhere,
  me,
  deleteAccount,
  changePassword,
  refreshToken,
  getActiveSessions,
  googleLogin,
  setPassword,
  revokeSession,
} from "../controllers/authController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  authLimiter,
  otpLimiter,
  passwordChangeLimiter,
  passwordRecoveryLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, registerEmailUser);
router.post("/verify-email", otpLimiter, verifyEmail);
router.post("/resend-verification", otpLimiter, resendEmailOtp);

router.post("/login", authLimiter, emailLogin);
router.post("/google", authLimiter, googleLogin);

router.post("/forgot-password", passwordRecoveryLimiter, forgotPassword); //two time reuse
router.post("/reset-password", passwordRecoveryLimiter, resetPassword);

router.patch(
  "/change-password",
  authMiddleware,
  passwordChangeLimiter,
  changePassword,
);
router.patch("/set-password", authMiddleware, passwordChangeLimiter, setPassword);

router.post("/logout", authMiddleware, logout);
router.post("/logout-all", authMiddleware, logoutFromEverywhere);

router.get("/me", authMiddleware, me);
router.get("/active-sessions", authMiddleware, getActiveSessions);

router.post("/refresh", refreshToken);
router.delete("/account-delete", authMiddleware, deleteAccount);
router.delete("/sessions/:sessionId", authMiddleware, revokeSession);

export default router;
