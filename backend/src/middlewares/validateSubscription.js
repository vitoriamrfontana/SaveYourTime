const ApiError = require("../utils/ApiError");

/**
 * validateCreateSubscription - valida o payload de POST /api/subscriptions
 * ANTES de chegar no controller. Mantém o controller limpo, focado só
 * em orquestrar a chamada ao model.
 */
function validateCreateSubscription(req, res, next) {
  const { nome, valorMensal } = req.body;

  if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
    return next(ApiError.badRequest("O campo 'nome' é obrigatório e deve ser um texto."));
  }

  if (nome.trim().length > 60) {
    return next(ApiError.badRequest("O campo 'nome' deve ter no máximo 60 caracteres."));
  }

  if (valorMensal === undefined || valorMensal === null || isNaN(Number(valorMensal))) {
    return next(ApiError.badRequest("O campo 'valorMensal' é obrigatório e deve ser numérico."));
  }

  if (Number(valorMensal) <= 0) {
    return next(ApiError.badRequest("O campo 'valorMensal' deve ser maior que zero."));
  }

  next();
}

/**
 * validateIdParam - garante que o :id da URL é um número válido antes
 * de chegar no controller/model.
 */
function validateIdParam(req, res, next) {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return next(ApiError.badRequest("O parâmetro 'id' deve ser numérico."));
  }

  next();
}

module.exports = { validateCreateSubscription, validateIdParam };