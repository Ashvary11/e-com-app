js;
import rateLimit from "express-rate-limit";

 
const createRateLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

 
export const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  "Too many authentication attempts. Please try again in 15 minutes.",
);

 
export const otpLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  "Too many verification attempts. Please try again in 15 minutes.",
);

 
export const passwordRecoveryLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  "Too many password recovery attempts. Please try again in 15 minutes.",
);

 
export const passwordChangeLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  "Too many password change attempts. Please try again in 15 minutes.",
);


 
export const paymentLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  "Too many payment requests. Please try again in 15 minutes.",
);

 
export const orderMutationLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  "Too many order requests. Please try again in 15 minutes.",
);

 
 
 
 