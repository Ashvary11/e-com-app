import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Never store the raw refresh token.
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
      index: true,
    },

    deviceName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    userAgent: {
      type: String,
      maxlength: 1000,
      default: null,
    },

    ipAddress: {
      type: String,
      maxlength: 100,
      default: null,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
// Index for finding sessions of a user
sessionSchema.index({ userId: 1, deviceName: 1, revokedAt: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;

// add ttl later for expired sessioon in next  7/30 days (keeping now for audit)
