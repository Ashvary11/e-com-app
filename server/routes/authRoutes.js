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
} from "../controllers/authController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

// import { isAuthorizedRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", registerEmailUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendEmailOtp);

router.post("/login", emailLogin);
router.post("/google", googleLogin);

router.post("/forgot-password", forgotPassword); //two time reuse
router.post("/reset-password", resetPassword);

router.patch("/change-password", authMiddleware, changePassword);

router.post("/logout", authMiddleware, logout);
router.post("/logout-all", authMiddleware, logoutFromEverywhere);

router.get("/me", authMiddleware, me);
router.get("/active-sessions", authMiddleware, getActiveSessions);

router.post("/refresh", refreshToken);
router.delete("/account-delete", authMiddleware, deleteAccount);

// ───── Admin routes (same resource, admin endpoints) ─────
// router.get("/users", authMiddleware, isAuthorizedRole(["admin"]), listUsers);
// //move this in admin route because it does not use same resources .

export default router;
