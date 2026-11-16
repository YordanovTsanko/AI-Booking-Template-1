import ApiError from '../utils/ApiError.js';

const isProd = () => process.env.NODE_ENV === 'production';

/** 404 for unknown API routes */
export const apiNotFound = (req, _res, next) => {
  next(new ApiError(404, 'Такъв маршрут не съществува', [{ field: 'route', message: `${req.method} ${req.originalUrl}` }]));
};

/** 404 for anything outside /api */
export const notFound = (req, _res, next) => {
  next(new ApiError(404, 'Такъв маршрут не съществува'));
};

const handleDuplicateKey = (err) => {
  const keys = Object.keys(err.keyPattern || err.keyValue || {});
  if (keys.includes('email')) {
    return ApiError.conflict('Този имейл вече е зает', [{ field: 'email', message: 'Този имейл вече е зает' }]);
  }
  if (keys.includes('staff') && keys.includes('time')) {
    return ApiError.conflict('Този час вече е зает, избери друг.', [
      { field: 'time', message: 'Хм, този час вече е зает. Избери друг.' },
    ]);
  }
  const field = keys[0] || 'field';
  return ApiError.conflict('Такъв запис вече съществува.', [{ field, message: 'Тази стойност вече е заета' }]);
};

/**
 * Converts any known error type into an ApiError.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.name === 'CastError' ? 'Невалидна стойност' : e.message,
    }));
    return ApiError.badRequest(
      errors.length === 1 ? errors[0].message : 'Има невалидни данни. Провери отбелязаните полета.',
      errors
    );
  }

  // Invalid ObjectId and other casts
  if (err.name === 'CastError') {
    return ApiError.badRequest('Невалиден идентификатор – такъв запис не съществува.', [
      { field: err.path, message: 'Невалидна стойност' },
    ]);
  }

  // Duplicate key
  if (err.code === 11000 || err.code === 11001) return handleDuplicateKey(err);

  if (err.name === 'DocumentNotFoundError') return ApiError.notFound('Записът не е намерен.');

  // JWT (in case thrown outside auth middleware)
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Сесията ти изтече. Моля, влез отново.');
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return ApiError.unauthorized('Невалиден токен за достъп. Моля, влез отново.');
  }

  // body-parser errors
  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Невалиден JSON в заявката. Провери формата на изпратените данни.');
  }
  if (err.type === 'entity.too.large' || err.status === 413) {
    return ApiError.payloadTooLarge('Заявката е твърде голяма. Максималният размер е 100KB.');
  }
  if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') {
    return ApiError.badRequest('Неподдържано кодиране на заявката.');
  }

  // Database unreachable
  if (
    ['MongooseServerSelectionError', 'MongoServerSelectionError', 'MongoNetworkError', 'MongoNotConnectedError'].includes(err.name) ||
    /buffering timed out/i.test(err.message || '')
  ) {
    return ApiError.unavailable('Базата данни не е свързана');
  }

  // Errors that already carry a status (e.g. from libraries)
  const status = err.statusCode || err.status;
  if (status && status >= 400 && status < 500) {
    return new ApiError(status, 'Невалидна заявка. Провери данните и опитай отново.');
  }

  return ApiError.internal();
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const error = normalizeError(err);

  if (error.statusCode === 500) {
    console.error(`💥 [${req.method} ${req.originalUrl}]`, err);
  } else if (error.statusCode === 503 && !req.originalUrl.startsWith('/api/health')) {
    console.warn(`⚠️  [${req.method} ${req.originalUrl}] ${err.message}`);
  }

  if (res.headersSent) return;

  const body = {
    success: false,
    message: error.message,
    errors: error.errors || [],
  };
  if (!isProd() && error.statusCode === 500 && err.stack) body.stack = err.stack;

  res.status(error.statusCode).json(body);
};
