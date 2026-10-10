
import express from "express";
import {
  getCart,
  mergeCart,
  updateCart,
} from "../controllers/cartController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getCart);
router.post("/merge-cart", authMiddleware, mergeCart);
router.put("/", authMiddleware, updateCart);

export default router;
