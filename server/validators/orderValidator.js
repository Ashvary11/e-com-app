import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid product ID",
  });

const orderItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  phone: z.string().trim().min(10, "Valid phone number is required"),
  addressLine: z.string().trim().min(5, "Address is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  postalCode: z.string().trim().min(4, "Postal code is required"),
  country: z.string().trim().min(2).default("India"),
});

export const createOrderSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Valid email is required")
    .transform((value) => value.toLowerCase()),

  idempotencyKey: z
    .string()
    .trim()
    .min(16, "Invalid idempotency key")
    .max(100, "Invalid idempotency key"),

  items: z
    .array(orderItemSchema)
    .min(1, "Order must contain at least one item")
    .max(50, "Too many items in order"),

  shippingAddress: shippingAddressSchema,
});
