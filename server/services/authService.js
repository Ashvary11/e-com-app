import User from "../models/User.js";
import Session from "../models/Session.js";

import {
  hashPassword,
  comparePassword,
  generateRandomToken,
  generateHashToken,
  generateRefreshToken,
  generateSessionId,
} from "../utils/auth.js";

import { generateJwtToken } from "../utils/jwt.js";

const REFRESH_TOKEN_DAYS = Number(
  process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 30,
);

export const createUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  // Generate a verification token.
  // Store only its hash in the database.
  // The raw token will later be sent through email.
  const verificationToken = generateRandomToken();

  const verificationTokenHash = generateHashToken(verificationToken);

  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "user",

    isEmailVerified: false,

    emailVerificationTokenHash: verificationTokenHash,
    emailVerificationTokenExpiresAt: tokenExpiresAt,
  });

  return {
    user,
    verificationToken,
  };
};

export const verifyEmail = async (token) => {
  const verificationTokenHash = generateHashToken(token);

  const user = await User.findOne({
    emailVerificationTokenHash: verificationTokenHash,
  });

  if (!user) {
    const error = new Error("Invalid or expired verification token.");
    error.statusCode = 400;
    throw error;
  }

  if (user.isEmailVerified) {
    const error = new Error("Email is already verified.");
    error.statusCode = 400;
    throw error;
  }

  if (
    !user.emailVerificationTokenExpiresAt ||
    user.emailVerificationTokenExpiresAt < new Date()
  ) {
    const error = new Error("Invalid or expired verification token.");
    error.statusCode = 400;
    throw error;
  }

  user.isEmailVerified = true;

  // Verification token is single-use.
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationTokenExpiresAt = undefined;

  await user.save();

  return user;
};
export const resendVerification = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    return null;
  }

  if (user.isEmailVerified) {
    const error = new Error("Email is already verified.");
    error.statusCode = 400;
    throw error;
  }

  const verificationToken = generateRandomToken();
  const verificationTokenHash = generateHashToken(verificationToken);
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.emailVerificationTokenHash = verificationTokenHash;
  user.emailVerificationTokenExpiresAt = tokenExpiresAt;

  await user.save();

  return {
    user,
    verificationToken,
  };
};

export const loginUser = async ({ email, password, userAgent, ipAddress }) => {
  // Password has select:false in the User model,
  // so explicitly include it for login.
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  // Reject inactive or blocked accounts.
  if (!user.isActive || user.isBlocked) {
    const error = new Error("Your account is not available.");
    error.statusCode = 403;
    throw error;
  }
  if (!user.isEmailVerified) {
    const error = new Error("Please verify your email before logging in.");
    error.statusCode = 403;
    throw error;
  }
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  // Create a new login session.
  const sessionId = generateSessionId();
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = generateHashToken(refreshToken);

  const sessionExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  );

  const session = await Session.create({
    userId: user._id,
    sessionId,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt: sessionExpiresAt,
  });

  // Short-lived access token.
  const jwtToken = generateJwtToken(user._id, session.sessionId);

  // Update last login time.
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user,
    jwtToken,
    refreshToken,
  };
};

// password reset token.
export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    return null;
  }

  if (!user.isActive || user.isBlocked) {
    return null;
  }

  const resetToken = generateRandomToken();

  const resetTokenHash = generateHashToken(resetToken);

  const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  user.passwordResetTokenHash = resetTokenHash;
  user.passwordResetTokenExpiresAt = resetTokenExpiresAt;

  await user.save();

  return {
    user,
    resetToken,
  };
};

export const resetPassword = async ({ token, password }) => {
  const tokenHash = generateHashToken(token);

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
  }).select("+passwordResetTokenHash");

  if (!user) {
    const error = new Error("Invalid or expired password reset token.");
    error.statusCode = 400;
    throw error;
  }

  if (
    !user.passwordResetTokenExpiresAt ||
    user.passwordResetTokenExpiresAt < new Date()
  ) {
    const error = new Error("Invalid or expired password reset token.");
    error.statusCode = 400;
    throw error;
  }

  user.password = await hashPassword(password);

  // Password reset token is single-use.
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpiresAt = undefined;

  await user.save();

  await Session.deleteMany({
    userId: user._id,
  });

  return user;
};

export const logoutUser = async (sessionId) => {
  if (!sessionId) {
    return;
  }

  await Session.updateOne(
    { sessionId },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};

export const logoutAllSessions = async (userId) => {
  await Session.updateMany(
    {
      userId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};

export const deleteUserAccount = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // Remove all login sessions first.
  await Session.deleteMany({
    userId: user._id,
  });

  // Remove linked social identities.
  // Only if AuthIdentity is part of your current schema.
  // We will add the import below if your model exists.
  //
  // await AuthIdentity.deleteMany({
  //   userId: user._id,
  // });

  await User.deleteOne({
    _id: user._id,
  });
};
