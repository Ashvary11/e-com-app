import express from "express";

import {
  getProductById,
  getProductCategories,
  getProductPriceRange,
  getProducts,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getProductCategories);
router.get("/price-range", getProductPriceRange);

router.get("/:id", getProductById);

export default router;
