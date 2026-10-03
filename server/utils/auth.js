import crypto from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

// ------------otp ------------

export const generateOtp = (length = 6) => {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(length, "0");
};
// -------------
export const generateHash = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};
//  ------------sessionID ------------
export const generateSessionId = () => {
  return crypto.randomUUID();
};
//  ------------token ------------
export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};
// Refresh tokens need more randomness because
// they can be used to create new access tokens.
export const generateRefreshToken = () => {
  return generateRandomToken(64);
};

// -----------------
