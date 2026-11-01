import rateLimit from 'express-rate-limit';

const handler = (windowMs: number, limit: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again soon.' } },
  });

export const authLimiter = handler(15 * 60_000, 30);
export const checkInLimiter = handler(60_000, 20);
export const nearbyLimiter = handler(60_000, 60);
