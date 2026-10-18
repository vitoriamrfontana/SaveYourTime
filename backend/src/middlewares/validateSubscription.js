const ApiError = require("../utils/ApiError");
const { CATEGORIAS, TIPOS_POR_CATEGORIA } = require("../models/subscriptionsModel");

/**
 * validateCreateSubscription - valida o payload de POST /api/subscriptions
 * ANTES de chegar no controller. Mantém o controller limpo, focado só
 * em orquestrar a chamada ao model.
 */
  function validateCreateSubscription(req, res, next) {
    const { nome, valorMensal } = req.body;
  
    if (req.body.categoria !== undefined && !CATEGORIAS.includes(req.body.categoria)) {
    return next(
      ApiError.badRequest(`O campo 'categoria' deve ser um destes: ${CATEGORIAS.join(", ")}.`)
    );
  }

  // Sprint 3: o tipo é opcional, mas se vier precisa pertencer à categoria
  if (req.body.tipo !== undefined) {
    const tiposDaCategoria = TIPOS_POR_CATEGORIA[req.body.categoria || "outros"] || [];
    if (!tiposDaCategoria.includes(req.body.tipo)) {
      return next(
        ApiError.badRequest(
          `O campo 'tipo' não pertence à categoria informada. Tipos válidos: ${tiposDaCategoria.join(", ") || "nenhum"}.`
        )
      );
    }
  }

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

  // Sprint 3: aceita só inteiros positivos (antes "1.5" e "-1" passavam)
  if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
    return next(ApiError.badRequest("O parâmetro 'id' deve ser um número inteiro positivo."));
  }

  next();
}

/**
 * validateUsageCheck - valida o payload de POST /api/subscriptions/:id/usage-check.
 * frequenciaUso = quantas vezes a pessoa usou o serviço no último mês.
 */
function validateUsageCheck(req, res, next) {
  const { frequenciaUso } = req.body;

  if (
    frequenciaUso === undefined ||
    frequenciaUso === null ||
    typeof frequenciaUso === "boolean" ||
    String(frequenciaUso).trim() === ""
  ) {
    return next(ApiError.badRequest("O campo 'frequenciaUso' é obrigatório."));
  }

  const usos = Number(frequenciaUso);
  if (!Number.isInteger(usos) || usos < 0 || usos > 1000) {
    return next(
      ApiError.badRequest("O campo 'frequenciaUso' deve ser um número inteiro entre 0 e 1000.")
    );
  }

  next();
}

module.exports = { validateCreateSubscription, validateIdParam, validateUsageCheck };