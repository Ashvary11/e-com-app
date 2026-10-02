import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ==================================================
    // Profile
    // ==================================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },

    avatar: {
      type: String,
      trim: true,
      default: null,
    },

    // ==================================================
    // Local Authentication
    // ==================================================

    // Null for accounts that do not have a local password,
    // for example a Google-only account.
    password: {
      type: String,
      default: null,
      select: false,
    },

    // ==================================================
    // Authorization
    // ==================================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    // ==================================================
    // Account State
    // ==================================================

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // ==================================================
    // Email Verification
    // ==================================================

    // Store only the hash of the verification token.
    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    // ==================================================
    // Password Reset
    // ==================================================

    // Store only the hash of the reset token.
    passwordResetTokenHash: {
      type: String,
      default: undefined,
      select: false,
    },

    passwordResetTokenExpiresAt: {
      type: Date,
      default: undefined,
      select: false,
    },

    // ==================================================
    // Security / Activity
    // ==================================================

    lastLoginAt: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
