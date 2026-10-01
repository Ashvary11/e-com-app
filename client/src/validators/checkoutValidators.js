import { z } from "zod";

export const checkoutSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  addressLine: z.string().trim().min(5, "Please enter your complete address"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit postal code"),
  country: z.string().trim().min(2, "Country is required"),
});
