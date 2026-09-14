const ApiError = require("../utils/ApiError");

/**
 * errorHandler - middleware de erro global do Express (precisa ser o
 * ÚLTIMO app.use() registrado em server.js, depois de todas as rotas).
 *
 * Captura tanto ApiError (erros de negócio esperados) quanto erros
 * inesperados, sempre respondendo no mesmo formato:
 *   { success: false, error: { message } }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }

  console.error("[ERRO NÃO TRATADO]", err);
  return res.status(500).json({
    success: false,
    error: { message: "Erro interno do servidor." },
  });
}

/**
 * notFoundHandler - captura requisições para rotas que não existem
 * (deve ser registrado depois de todas as rotas, antes do errorHandler).
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: { message: `Rota ${req.method} ${req.originalUrl} não encontrada.` },
  });
}

module.exports = { errorHandler, notFoundHandler };