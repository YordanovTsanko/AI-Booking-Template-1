import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/jwt.js';

const MESSAGES = {
  missing: 'Не си влязъл в профила си. Моля, влез, за да продължиш.',
  invalid: 'Невалиден токен за достъп. Моля, влез отново.',
  expired: 'Сесията ти изтече. Моля, влез отново.',
  userGone: 'Профилът, свързан с тази сесия, вече не съществува. Моля, влез отново.',
  inactive: 'Профилът ти е деактивиран. Свържи се с администратор.',
  forbidden: 'Нямаш права за това действие.',
};

export const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token && token !== 'null' && token !== 'undefined') return token;
  }
  return req.cookies?.token || null;
};

const decodeOrThrow = (token) => {
  try {
    return verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized(MESSAGES.expired);
    throw ApiError.unauthorized(MESSAGES.invalid);
  }
};

/** Requires a valid token. Distinguishes missing / invalid / expired. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized(MESSAGES.missing);

  const decoded = decodeOrThrow(token);
  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized(MESSAGES.userGone);
  if (!user.isActive) throw ApiError.forbidden(MESSAGES.inactive);

  req.user = user;
  next();
});

/** Attaches req.user when a valid token is present; never blocks. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // invalid token on a public route – treat as guest
  }
  next();
});

/** Role guard – use after protect. */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized(MESSAGES.missing));
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden(MESSAGES.forbidden));
  next();
};
