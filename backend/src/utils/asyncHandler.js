/**
 * asyncHandler - envolve uma função de controller assíncrona e encaminha
 * qualquer erro para o middleware de erro global (next(err)), evitando
 * repetir try/catch em cada controller.
 *
 * Uso:
 *   router.get("/", asyncHandler(controller.listSubscriptions));
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;