import express from "express";

import {
  getProductByIdentifier,
  getProductCategories,
  getProductPriceRange,
  getProducts,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getProductCategories);
router.get("/price-range", getProductPriceRange);

// router.get("/:id", getProductById);
router.get("/:identifier", getProductByIdentifier);

export default router;
