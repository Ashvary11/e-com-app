import User from "../models/User.js";
import Session from "../models/Session.js";

import {
  hashPassword,
  comparePassword,
  generateRefreshToken,
  generateSessionId,
  generateOtp,
  generateHash,
} from "../utils/auth.js";

import { generateJwtToken } from "../utils/jwt.js";

export const REFRESH_TOKEN_DAYS = Number(
  process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 30,
);

export const userRegistrationFn = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.isEmailVerified !== true) {
      const otp = generateOtp();
      const hashOtp = generateHash(otp);
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      existingUser.name = name;
      existingUser.password = await hashPassword(password);
      existingUser.emailVerificationOtpHash = hashOtp;
      existingUser.emailVerificationOtpExpiresAt = otpExpiresAt;
      existingUser.emailVerificationOtpAttempts = 0;
      existingUser.emailVerificationOtpLastSentAt = new Date();
      await existingUser.save();
      return { user: existingUser, otp };
    }
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const otp = generateOtp();
  const hashOtp = generateHash(otp);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "user",
    isEmailVerified: false,
    emailVerificationOtpHash: hashOtp,
    emailVerificationOtpExpiresAt: otpExpiresAt,
  });

  return {
    user,
    otp,
  };
};

export const emailVerificationFn = async (otp, email) => {
  const user = await User.findOne({ email }).select(
    "+emailVerificationOtpHash +emailVerificationOtpExpiresAt +emailVerificationOtpAttempts",
  );

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (user.isEmailVerified) {
    const error = new Error("Email is already verified.");
    error.statusCode = 400;
    throw error;
  }

  if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
    const error = new Error("No OTP request found.");
    error.statusCode = 400;
    throw error;
  }

  if (user.emailVerificationOtpExpiresAt < new Date()) {
    const error = new Error("OTP expired.");
    error.statusCode = 400;
    throw error;
  }

  if (user.emailVerificationOtpAttempts >= 5) {
    const error = new Error("Too many attempts. Request a new OTP.");
    error.statusCode = 429;
    throw error;
  }

  const otpHash = generateHash(otp);

  if (otpHash !== user.emailVerificationOtpHash) {
    user.emailVerificationOtpAttempts += 1;
    await user.save();
    const error = new Error("Invalid OTP.");
    error.statusCode = 400;
    throw error;
  }

  user.isEmailVerified = true;
  user.emailVerificationOtpHash = null;
  user.emailVerificationOtpExpiresAt = null;
  user.emailVerificationOtpAttempts = 0;

  await user.save();
  return user;
};

export const resendEmailOtpFn = async (email) => {
  const user = await User.findOne({ email }).select(
    "+emailVerificationOtpHash +emailVerificationOtpExpiresAt +emailVerificationOtpAttempts +emailVerificationOtpLastSentAt",
  );

  if (!user) {
    console.log("user not found");

    return null;
  }

  if (user.isEmailVerified) {
    const error = new Error("Email is already verified.");
    error.statusCode = 400;
    throw error;
  }

  const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

  if (
    user.emailVerificationOtpLastSentAt &&
    Date.now() - user.emailVerificationOtpLastSentAt.getTime() <
      RESEND_COOLDOWN_MS
  ) {
    const waitSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS -
        (Date.now() - user.emailVerificationOtpLastSentAt.getTime())) /
        1000,
    );
    const error = new Error(
      `Please wait ${waitSeconds}s before requesting a new code.`,
    );
    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtp(); // e.g. "482913"
  const hashedOtp = generateHash(otp);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  user.emailVerificationOtpHash = hashedOtp;
  user.emailVerificationOtpExpiresAt = otpExpiresAt;
  user.emailVerificationOtpAttempts = 0;
  user.emailVerificationOtpLastSentAt = new Date();

  await user.save();

  return {
    otp, // raw OTP — pass to email sender, NEVER to frontend
  };
};

export const emailLoginFn = async ({
  email,
  password,
  userAgent,
  ipAddress,
}) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

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
  const { jwtToken, refreshToken } = await createUserSession({
    user,
    userAgent,
    ipAddress,
  });
  return { user, jwtToken, refreshToken };
};

// password reset token.
export const forgotPasswordFn = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    return null;
  }

  if (!user.isActive || user.isBlocked) {
    return null;
  }

  const otp = generateOtp(); // e.g. "482913"
  const hashedOtp = generateHash(otp);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  user.passwordResetOtpHash = hashedOtp;
  user.passwordResetOtpExpiresAt = otpExpiresAt;

  await user.save();

  return {
    // user,
    otp,
  };
};
// add change password function later wit old pass new passwrd check new password and update then send mail that password for uyou has been changed.

export const resetPasswordFn = async ({
  email,
  otp,
  newPassword,
  confirmPassword,
}) => {
  if (newPassword !== confirmPassword) {
    const error = new Error("Passwords do not match.");
    error.statusCode = 400;
    throw error;
  }
  const hashOtp = generateHash(otp);
  const user = await User.findOne({
    email,
  }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt");

  if (!user) {
    const error = new Error("User NOt Found.");
    error.statusCode = 400;
    throw error;
  }

  if (
    !user.passwordResetOtpExpiresAt ||
    user.passwordResetOtpExpiresAt < new Date()
  ) {
    const error = new Error(
      "Invalid or expired password reset token. Otp fields ",
    );
    error.statusCode = 400;
    throw error;
  }
  if (user.passwordResetOtpHash !== hashOtp) {
    const error = new Error("Invalid or expired OTP.");
    error.statusCode = 400;
    throw error;
  }
  user.password = await hashPassword(newPassword);

  // Password reset token is single-use.
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;

  await user.save();

  // await Session.deleteMany({
  //   userId: user._id,
  // }); // invalidated active sessions
  await Session.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  return user;
};

export const logoutFn = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    return;
  }

  await Session.updateOne(
    {
      userId,
      sessionId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};

export const logoutAllSessionsFn = async (userId) => {
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

export const deleteUserAccountFn = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // Remove all login sessions first.
  await Session.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  // await Session.deleteMany({
  //   userId: user._id,
  // });

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

// in authService.js
export const createUserSession = async ({ user, userAgent, ipAddress }) => {
  // Check for an existing active session from the same client
  let session = await Session.findOne({
    userId: user._id,
    userAgent,
    ipAddress,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = generateHash(refreshToken);
  const sessionExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  );

  if (session) {
    // Reuse — rotate the refresh token
    session.refreshTokenHash = refreshTokenHash;
    session.expiresAt = sessionExpiresAt;
    await session.save();
  } else {
    // New session
    const sessionId = generateSessionId();
    session = await Session.create({
      userId: user._id,
      sessionId,
      refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt: sessionExpiresAt,
    });
  }

  const jwtToken = generateJwtToken(user._id, session.sessionId);

  user.lastLoginAt = new Date();
  await user.save();

  return { user, jwtToken, refreshToken };
};

export const changePasswordFn = async ({
  userId,
  currentPassword,
  newPassword,
  currentSessionId,
}) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive || user.isBlocked) {
    const error = new Error("Your account is not available.");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 401;
    throw error;
  }

  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) {
    const error = new Error(
      "New password must be different from current password.",
    );
    error.statusCode = 400;
    throw error;
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  //   Revoke all OTHER sessions, keep the current one logged in
  await Session.updateMany(
    {
      userId: user._id,
      revokedAt: null,
      sessionId: { $ne: currentSessionId },
    },
    { $set: { revokedAt: new Date() } },
  );

  return user;
};
