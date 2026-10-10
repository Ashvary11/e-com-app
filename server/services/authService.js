import User from "../models/User.js";
import Session from "../models/Session.js";
import AuthIdentity from "../models/AuthIdentity.js";

import {
  hashPassword,
  comparePassword,
  generateRefreshToken,
  generateSessionId,
  generateOtp,
  generateHash,
} from "../utils/auth.js";

import { generateJwtToken } from "../utils/jwt.js";
import { parseUserAgent } from "../utils/parseUserAgent.js";
import { throwError } from "../utils/errors.js";
import { verifyGoogleToken } from "./googleAuthService.js";

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

    throwError("An account with this email already exists.", 409);
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
    hasPassword: true,
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

  if (!user) throwError("User not found.", 404);

  if (user.isEmailVerified) throwError("Email is already verified.", 400);

  if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
    throwError("Invalid OTP", 400);
  }

  if (user.emailVerificationOtpExpiresAt < new Date()) {
    throwError("OTP expired.", 400);
  }

  if (user.emailVerificationOtpAttempts >= 5) {
    throwError("Too many attempts.", 429);
  }

  const otpHash = generateHash(otp);

  if (otpHash !== user.emailVerificationOtpHash) {
    user.emailVerificationOtpAttempts += 1;
    await user.save();
    throwError("Invalid OTP.", 400);
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
    throwError("User not found.", 404);
    return null;
  }

  if (user.isEmailVerified) {
    throwError("Email is already verified.", 400);
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

    throwError(
      `Please wait ${waitSeconds}s before requesting a new code.`,
      429,
    );
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
    throwError("Invalid email or password.", 401);
  }

  if (!user.isActive || user.isBlocked) {
    throwError("Account Inactive / Blocked", 403);
  }
  if (!user.isEmailVerified) {
    throwError("Please verify your email before logging in.", 403);
  }
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throwError("Invalid credentials.", 401, {
      email: ["Wrong email or password."],
    });
  }

  // Create a new login session.
  const { jwtToken, refreshToken } = await createUserSession({
    user,
    userAgent,
    ipAddress,
  });
  return { user, jwtToken, refreshToken };
};

export const forgotPasswordFn = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throwError("Invalid credentials.", 401);
    return null;
  }

  if (!user.isActive || user.isBlocked) {
    throwError("User Inactive / Blocked", 401);
    return null;
  }

  const otp = generateOtp(); // e.g. "482913"
  const hashedOtp = generateHash(otp);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  user.passwordResetOtpHash = hashedOtp;
  user.passwordResetOtpExpiresAt = otpExpiresAt;

  await user.save();

  return {
    user,
    otp,
  };
};

export const resetPasswordFn = async ({
  email,
  otp,
  newPassword,
  confirmPassword,
}) => {
  if (newPassword !== confirmPassword) {
    throwError("Passwords do not match.", 400);
  }
  const hashOtp = generateHash(otp);
  const user = await User.findOne({
    email,
  }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt");

  if (!user) {
    throwError("User not found.", 404);
  }

  if (
    !user.passwordResetOtpExpiresAt ||
    user.passwordResetOtpExpiresAt < new Date()
  ) {
    throwError("Invalid OTP.", 400);
  }
  if (user.passwordResetOtpHash !== hashOtp) {
    throwError("Invalid OTP.", 400);
  }
  user.password = await hashPassword(newPassword);

  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;

  await user.save();
  await Session.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  return user;
};

export const logoutFn = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    throwError("User not found.", 404);
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
    throwError("User not found.", 404);
  }

  await Session.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  await User.deleteOne({
    _id: user._id,
  });
};

export const createUserSession = async ({ user, userAgent, ipAddress }) => {
  const { deviceName } = parseUserAgent(userAgent);

  let session = await Session.findOne({
    userId: user._id,
    // userAgent,
    // ipAddress,
    deviceName,
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
    session.lastUsedAt = new Date();
    session.ipAddress = ipAddress;
    session.userAgent = userAgent;
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
      deviceName,
      expiresAt: sessionExpiresAt,
    });
  }

  const jwtToken = generateJwtToken(user._id, session.sessionId);

  await User.updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date() } },
  );

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
    throwError("User not found.", 404);
  }

  if (!user.isActive || user.isBlocked) {
    throwError("Account Inactive / Blocked", 403);
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throwError("Invalid credentials.", 401);
  }

  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) {
    throwError("New password must be different from current password.", 400);
  }

  user.password = await hashPassword(newPassword);
  await user.save();

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

export const refreshSessionFn = async ({ refreshToken }) => {
  if (!refreshToken) {
    throwError("Refresh token missing.", 401);
  }
  const refreshTokenHash = generateHash(refreshToken);

  const session = await Session.findOne({
    refreshTokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+refreshTokenHash +userId +sessionId");

  if (!session) {
    throwError("Token missing.", 401);
  }

  const user = await User.findById(session.userId);

  if (!user) {
    session.revokedAt = new Date();
    await session.save();

    throwError("User not found.", 404);
  }

  if (!user.isActive || user.isBlocked) {
    throwError("User Inactive / Blocked.", 403);
  }

  // Rotate the refresh token
  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = generateHash(newRefreshToken);
  const newSessionExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  );

  session.refreshTokenHash = newRefreshTokenHash;
  session.expiresAt = newSessionExpiresAt;
  session.lastUsedAt = new Date();
  await session.save();

  // Issue a fresh access token bound to the same sessionId
  const jwtToken = generateJwtToken(user._id, session.sessionId);

  return { user, jwtToken, refreshToken: newRefreshToken };
};
export const getActiveSessionsFn = async (userId) => {
  if (!userId || typeof userId === "object") {
    throwError(
      "getActiveSessionsFn expected a userId string/ObjectId, got: ${typeof userId}",
    );
  }

  return await Session.find(
    { userId, revokedAt: null, expiresAt: { $gt: new Date() } },
    {
      sessionId: 1,
      deviceName: 1,
      ipAddress: 1,
      lastUsedAt: 1,
      createdAt: 1,
    },
  ).sort({ lastUsedAt: -1 });
};

export const revokeSessionFn = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    throwError("User ID and session ID are required.", 400);
  }

  const session = await Session.findOneAndUpdate(
    {
      userId,
      sessionId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: { revokedAt: new Date() },
    },
    {
      returnDocument: true,
    },
  );

  if (!session) {
    throwError("Active session not found.", 404);
  }

  return session;
};

export const googleLoginFn = async ({ credential, userAgent, ipAddress }) => {
  const googleUser = await verifyGoogleToken(credential);

  if (!googleUser.emailVerified) {
    throwError("Google email is not verified.", 401);
  }

  let authIdentity = await AuthIdentity.findOne({
    provider: "google",
    providerAccountId: googleUser.providerAccountId,
  });

  let user;
  let isNewUser = false;

  if (authIdentity) {
    user = await User.findById(authIdentity.userId);
    if (!user) {
      throwError("User account not found.", 404);
    }

    authIdentity.lastUsedAt = new Date();
    await authIdentity.save();
  } else {
    user = await User.findOne({ email: googleUser.email });

    if (user) {
      if (!user.isActive || user.isBlocked) {
        throwError("Account Inactive / Blocked.", 403);
      }

      authIdentity = await AuthIdentity.create({
        userId: user._id,
        provider: "google",
        providerAccountId: googleUser.providerAccountId,
        email: googleUser.email,
        username: googleUser.name,
        profileUrl: googleUser.avatar,
      });
    } else {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.avatar,
        password: null,
        role: "user",
        isEmailVerified: true,
      });
      let isNewUser = true; //just for alert in client
      authIdentity = await AuthIdentity.create({
        userId: user._id,
        provider: "google",
        providerAccountId: googleUser.providerAccountId,
        email: googleUser.email,
        username: googleUser.name,
        profileUrl: googleUser.avatar,
      });
    }
  }

  if (!user.isActive || user.isBlocked) {
    throwError("Account Inactive / Blocked.", 403);
  }

  const { jwtToken, refreshToken } = await createUserSession({
    user,
    userAgent,
    ipAddress,
  });

  return {
    user,
    jwtToken,
    refreshToken,
    isNewUser,
  };
};
export const setPasswordFn = async ({
  userId,
  newPassword,
  confirmPassword,
  currentSessionId,
}) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throwError("User not found.", 404);
  }

  if (!user.isActive || user.isBlocked) {
    throwError("Account inactive or blocked.", 403);
  }

  // Only accounts without an existing password can use this function.
  if (user.hasPassword === true || user.password) {
    throwError(
      "Your account already has a password. Use Change Password.",
      400,
    );
  }

  if (newPassword !== confirmPassword) {
    throwError("Passwords do not match.", 400);
  }

  user.password = await hashPassword(newPassword);
  user.hasPassword = true;

  await user.save();

  // Keep the current session active and revoke others .
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
