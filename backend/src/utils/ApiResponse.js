/**
 * Consistent success response:
 * { success: true, message: "...", data: ..., meta?: {...} }
 */
class ApiResponse {
  constructor(statusCode, message, data = null, meta = undefined, extra = undefined) {
    this.success = statusCode < 400;
    this.message = message;
    if (extra && typeof extra === 'object') Object.assign(this, extra);
    this.data = data;
    if (meta) this.meta = meta;
  }

  static send(res, statusCode, message, data = null, meta = undefined, extra = undefined) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta, extra));
  }

  static ok(res, message, data = null, meta = undefined) {
    return ApiResponse.send(res, 200, message, data, meta);
  }

  static created(res, message, data = null) {
    return ApiResponse.send(res, 201, message, data);
  }
}

export default ApiResponse;
