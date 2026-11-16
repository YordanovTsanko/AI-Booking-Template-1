import { Router } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { isDbConnected } from '../config/db.js';

const router = Router();
const PING_TIMEOUT_MS = 1500;

/** Tiny DB ping with a hard timeout – detects a dead DB faster than the driver heartbeat. */
const pingDb = async () => {
  if (!isDbConnected() || !mongoose.connection.db) return false;
  let timer;
  try {
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(false), PING_TIMEOUT_MS);
    });
    const ping = mongoose.connection.db
      .admin()
      .command({ ping: 1 })
      .then(() => true)
      .catch(() => false);
    return await Promise.race([ping, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * GET /api/health – lightweight, not rate-limited.
 * 200 → { success: true, status: "ok", message: "Сървърът работи", uptime, dbStatus: "connected" }
 * 503 → { success: false, message: "Базата данни не е свързана" }
 */
router.get('/', async (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const ok = await pingDb();
  if (!ok) {
    return next(ApiError.unavailable('Базата данни не е свързана', [{ field: 'dbStatus', message: 'disconnected' }]));
  }
  return ApiResponse.send(res, 200, 'Сървърът работи', null, undefined, {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    dbStatus: 'connected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
