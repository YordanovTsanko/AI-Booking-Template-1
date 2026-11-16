import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

const makeLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(ApiError.tooManyRequests(message)),
  });

/** General API limiter */
export const apiLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Твърде много заявки за кратко време. Изчакай няколко минути и опитай отново.',
});

/** Stricter limiter for login/register (brute-force protection) */
export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Твърде много опити за вход. Изчакай 15 минути и опитай отново.',
});

/** AI endpoints limiter (protects the OpenAI budget) */
export const aiLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Пишеш ми твърде бързо 🙂 Изчакай минутка и опитай отново.',
});
