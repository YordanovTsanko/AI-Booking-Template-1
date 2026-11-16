/**
 * Wraps an async Express handler so any thrown error / rejected promise
 * is forwarded to the global error middleware. No try/catch duplication.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
