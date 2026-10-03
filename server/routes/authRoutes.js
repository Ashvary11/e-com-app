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
} from "../controllers/authController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerEmailUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendEmailOtp);
router.post("/login", emailLogin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.patch("/change-password", authMiddleware, changePassword);

router.post("/logout", authMiddleware, logout);
router.post("/logout-all", authMiddleware, logoutFromEverywhere);

router.get("/me", authMiddleware, me);

router.delete("/account-delete", authMiddleware, deleteAccount);
export default router;
