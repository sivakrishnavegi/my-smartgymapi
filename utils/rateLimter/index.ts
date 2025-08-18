import rateLimit from "express-rate-limit";

// Global limiter
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true, 
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, slow down!" }
});

