// Wraps async route handlers — eliminates try/catch in every controller
export const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};