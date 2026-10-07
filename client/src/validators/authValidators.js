import { z } from "zod";

const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(254, "Email must not exceed 254 characters");

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

const otpSchema = z
  .string({ required_error: "OTP is required" })
  .trim()
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits");

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),

  email: emailSchema,
  password: passwordSchema,
});

export const verifyEmailOnlySchema = z.object({
  email: emailSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export const loginWithEmailSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .max(128, "Password must not exceed 128 characters"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: z
      .string({ required_error: "Please confirm your password" })
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Current password is required" })
      .min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z
      .string({ required_error: "Please confirm your new password" })
      .min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });