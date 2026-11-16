/**
 * Operational error with an HTTP status code and optional field errors.
 * errors: [{ field: 'email', message: 'Въведи валиден имейл' }]
 */
class ApiError extends Error {
  constructor(statusCode = 500, message = 'Ох, нещо се обърка при нас. Опитай отново след малко.', errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = Array.isArray(errors) ? errors : [];
    this.isOperational = true;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Невалидна заявка. Провери данните и опитай отново.', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Не си влязъл в профила си. Моля, влез, за да продължиш.', errors = []) {
    return new ApiError(401, message, errors);
  }

  static forbidden(message = 'Нямаш права за това действие.', errors = []) {
    return new ApiError(403, message, errors);
  }

  static notFound(message = 'Не намерихме това, което търсиш.', errors = []) {
    return new ApiError(404, message, errors);
  }

  static conflict(message = 'Този запис вече съществува.', errors = []) {
    return new ApiError(409, message, errors);
  }

  static payloadTooLarge(message = 'Заявката е твърде голяма. Изпрати по-малко данни.') {
    return new ApiError(413, message);
  }

  static tooManyRequests(message = 'Твърде много заявки за кратко време. Изчакай малко и опитай отново.') {
    return new ApiError(429, message);
  }

  static internal(message = 'Ох, нещо се обърка при нас. Опитай отново след малко.') {
    return new ApiError(500, message);
  }

  static unavailable(message = 'Базата данни не е свързана', errors = []) {
    return new ApiError(503, message, errors);
  }
}

export default ApiError;
