import ApiError from '../utils/ApiError.js';
import { isDbConnected } from '../config/db.js';

/**
 * Fails fast with 503 instead of letting Mongoose buffer queries
 * for 10 seconds when the database is down.
 */
const requireDb = (_req, _res, next) => {
  if (!isDbConnected()) {
    return next(ApiError.unavailable('Базата данни не е свързана', [{ field: 'database', message: 'Изчакай малко и опитай отново.' }]));
  }
  next();
};

export default requireDb;
