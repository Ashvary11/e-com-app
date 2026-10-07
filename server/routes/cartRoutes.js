import express from "express";

import { syncCart, updateCart } from "../controllers/cartController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/sync", authMiddleware, syncCart);
router.put("/", authMiddleware, updateCart);




export default router;
