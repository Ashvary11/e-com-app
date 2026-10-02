import mongoose from "mongoose";

const authIdentitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["google", "github", "facebook", "instagram", "linkedin", "apple"],
      required: true,
    },

    providerAccountId: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 254,
      default: null,
    },

    username: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    profileUrl: {
      type: String,
      trim: true,
      default: null,
    },

    connectedAt: {
      type: Date,
      default: Date.now,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// One external account can belong to only one CartSphere user.
authIdentitySchema.index(
  {
    provider: 1,
    providerAccountId: 1,
  },
  {
    unique: true,
  },
);

const AuthIdentity = mongoose.model("AuthIdentity", authIdentitySchema);

export default AuthIdentity;
