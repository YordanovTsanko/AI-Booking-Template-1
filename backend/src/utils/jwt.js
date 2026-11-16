import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRE = '7d';
const EXPIRE_PATTERN = /^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y)?$/i;

let fallbackSecret = null;
let expireWarned = false;

/**
 * Returns JWT_SECRET from .env. If empty, generates a temporary random secret
 * so the app never crashes (all sessions reset on restart).
 */
export const getJwtSecret = () => {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (secret) return secret;
  if (!fallbackSecret) {
    fallbackSecret = crypto.randomBytes(48).toString('hex');
    console.warn('⚠️  JWT_SECRET is empty – using a temporary random secret. Users will be logged out on every restart. Set JWT_SECRET in backend/.env');
  }
  return fallbackSecret;
};

export const getJwtExpire = () => {
  const value = (process.env.JWT_EXPIRE || '').trim();
  if (!value) return DEFAULT_EXPIRE;
  if (EXPIRE_PATTERN.test(value)) return /^\d+$/.test(value) ? Number(value) : value;
  if (!expireWarned) {
    expireWarned = true;
    console.warn(`⚠️  JWT_EXPIRE "${value}" is invalid – falling back to ${DEFAULT_EXPIRE}`);
  }
  return DEFAULT_EXPIRE;
};

export const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, getJwtSecret(), { expiresIn: getJwtExpire() });

export const verifyToken = (token) => jwt.verify(token, getJwtSecret());

export const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};
