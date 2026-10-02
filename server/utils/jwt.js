import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

const EXPIRE_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m";

export const generateJwtToken = (userId, sessionId) => {
  return jwt.sign(
    {
      uid: userId.toString(),
      sid: sessionId,
    },
    JWT_SECRET,
    {
      expiresIn: EXPIRE_IN,
    },
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// JwtToken is AccessToken

// accessToken :  ~15 minutes (can rotate every 15 mins or when ever it expires)
// refreshToken : ~30 days | connected to session
