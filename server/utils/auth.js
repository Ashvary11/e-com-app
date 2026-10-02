import crypto from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};
// Used for email verification and password reset.
export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};
// Refresh tokens need more randomness because
// they can be used to create new access tokens.
export const generateRefreshToken = () => {
  return generateRandomToken(64);
};

// Store only the hash in the database.
export const generateHashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Unique ID for each login session.
export const generateSessionId = () => {
  return crypto.randomUUID();
};
