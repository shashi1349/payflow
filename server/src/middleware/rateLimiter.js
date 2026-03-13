import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute — hardcoded, no parseInt needed
  max: 10,
  message: {
    success: false,
    error: "Too many requests, please try again after a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});