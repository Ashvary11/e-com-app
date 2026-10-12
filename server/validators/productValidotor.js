
import { z } from "zod";

const nameSchema = z
  .string({ required_error: "Product name is required" })
  .trim()
  .min(1, "Product name is required")
  .max(200, "Product name must not exceed 200 characters");

const skuSchema = z
  .string()
  .trim()
  .min(1, "SKU is required")
  .max(100, "SKU must not exceed 100 characters")
  .transform((value) => value.toUpperCase());

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(220, "Slug must not exceed 220 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain lowercase letters, numbers, and hyphens",
  );

const descriptionSchema = z
  .string({ required_error: "Description is required" })
  .trim()
  .min(1, "Description is required")
  .max(10000, "Description must not exceed 10000 characters");

const priceSchema = z
  .number({ required_error: "Price is required" })
  .finite("Price must be a valid number")
  .min(0, "Price cannot be negative");

const originalPriceSchema = z
  .number()
  .finite("Original price must be a valid number")
  .min(0, "Original price cannot be negative")
  .optional();

const categorySchema = z
  .string({ required_error: "Category is required" })
  .trim()
  .min(1, "Category is required")
  .max(100, "Category must not exceed 100 characters");

const brandSchema = z
  .string()
  .trim()
  .max(100, "Brand must not exceed 100 characters")
  .optional();

const imagesSchema = z
  .array(
    z.string().trim().min(1, "Image URL cannot be empty"),
  )
  .max(20, "A maximum of 20 images is allowed")
  .optional();

const stockSchema = z
  .number()
  .int("Stock must be a whole number")
  .min(0, "Stock cannot be negative")
  .optional();

const ratingSchema = z
  .number()
  .finite("Rating must be a valid number")
  .min(0, "Rating cannot be less than 0")
  .max(5, "Rating cannot exceed 5")
  .optional();

const reviewCountSchema = z
  .number()
  .int("Review count must be a whole number")
  .min(0, "Review count cannot be negative")
  .optional();

// Create product
export const createProductSchema = z.object({
  name: nameSchema,
  sku: skuSchema.optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema,
  price: priceSchema,
  originalPrice: originalPriceSchema,
  category: categorySchema,
  brand: brandSchema,
  images: imagesSchema,
  stock: stockSchema,
  rating: ratingSchema,
  reviewCount: reviewCountSchema,
  isActive: z.boolean().optional(),
});

// Update product: every field is optional.
export const updateProductSchema = z
  .object({
    name: nameSchema.optional(),
    sku: skuSchema.optional(),
    slug: slugSchema.optional(),
    description: descriptionSchema.optional(),
    price: priceSchema.optional(),
    originalPrice: originalPriceSchema,
    category: categorySchema.optional(),
    brand: brandSchema,
    images: imagesSchema,
    stock: stockSchema,
    rating: ratingSchema,
    reviewCount: reviewCountSchema,
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

// Activate/deactivate product
export const productStatusSchema = z.object({
  isActive: z.boolean({
    required_error: "Product status is required",
  }),
});
