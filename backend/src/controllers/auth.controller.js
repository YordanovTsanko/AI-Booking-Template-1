import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken, getCookieOptions } from '../utils/jwt.js';

const sendAuth = (res, statusCode, message, user) => {
  const token = signToken(user);
  res.cookie('token', token, getCookieOptions());
  return ApiResponse.send(res, statusCode, message, { user: user.toJSON(), token });
};

const firstName = (name = '') => String(name).trim().split(/\s+/)[0];

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name).trim();
  const email = String(req.body.email).trim().toLowerCase();
  const phone = req.body.phone ? String(req.body.phone).trim() : '';

  const exists = await User.exists({ email });
  if (exists) {
    throw ApiError.conflict('Този имейл вече е зает', [
      { field: 'email', message: 'Този имейл вече е зает. Пробвай да влезеш или използвай друг.' },
    ]);
  }

  // Public registration always creates a client – roles are never taken from the body.
  const user = await User.create({ name, email, phone, password: req.body.password, role: 'client' });

  return sendAuth(res, 201, `Успешна регистрация, добре дошъл, ${firstName(user.name)}!`, user);
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Не намерихме профил с този имейл.', [
      { field: 'email', message: 'Няма регистриран профил с този имейл' },
    ]);
  }

  const isMatch = await user.comparePassword(req.body.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Грешна парола, опитай отново', [
      { field: 'password', message: 'Грешна парола, опитай отново' },
    ]);
  }

  if (!user.isActive) throw ApiError.forbidden('Профилът ти е деактивиран. Свържи се с администратор.');

  return sendAuth(res, 200, `Здравей отново, ${firstName(user.name)}! Радваме се да те видим.`, user);
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (_req, res) => {
  const { maxAge, ...options } = getCookieOptions();
  res.clearCookie('token', options);
  return ApiResponse.ok(res, 'Излезе успешно. Ще се видим скоро!');
});

/** GET /api/auth/me */
export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, 'Профилът е зареден.', { user: req.user.toJSON() });
});

/** PUT /api/auth/me – update own name / phone */
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = String(name).trim();
  if (phone !== undefined) req.user.phone = String(phone).trim();
  await req.user.save();
  return ApiResponse.ok(res, 'Профилът ти е обновен.', { user: req.user.toJSON() });
});
