/**
 * CONTROLLER - Detox de Assinaturas
 *
 * Responsável só por orquestrar: chama o model, formata a resposta
 * com apiResponse() e delega erros para o middleware global via
 * asyncHandler/ApiError. Validação de entrada já veio pronta da
 * camada de middleware (validateSubscription.js).
 */

const subscriptionsModel = require("../models/subscriptionsModel");
const UserModel = require("../models/userModel"); // somente leitura (valorHora do Perfil)
const ApiError = require("../utils/ApiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/subscriptions
const listSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = subscriptionsModel.getSubscriptions();
  const economia = subscriptionsModel.getEconomiaTotal();

  return apiResponse(res, 200, { subscriptions, economia });
});

// POST /api/subscriptions
const createSubscription = asyncHandler(async (req, res) => {
  const { nome, valorMensal, categoria } = req.body;
  const novaAssinatura = subscriptionsModel.addSubscription({ nome, valorMensal, categoria });

  return apiResponse(res, 201, novaAssinatura);
});

// PATCH /api/subscriptions/:id/toggle
const toggleSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assinaturaAtualizada = subscriptionsModel.toggleSubscription(id);

  if (!assinaturaAtualizada) {
    throw ApiError.notFound(`Assinatura com id ${id} não encontrada.`);
  }

  return apiResponse(res, 200, assinaturaAtualizada);
});

// GET /api/subscriptions/insights
// Reúne tudo que a tela do Detox Avançado precisa em uma chamada só.
const getInsights = asyncHandler(async (req, res) => {
  const { valorHora, horasMensais } = UserModel.getProfile();

  return apiResponse(res, 200, {
    horasTrabalho: subscriptionsModel.calcularHorasTrabalho({ valorHora, horasMensais }),
    custoInvisivel: subscriptionsModel.calcularCustoInvisivel(),
    projecaoJuros: subscriptionsModel.calcularProjecaoJuros(),
    categorias: subscriptionsModel.CATEGORIAS,
  });
});

// GET /api/subscriptions/auditoria
const getAuditoria = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, subscriptionsModel.getAuditoria());
});

module.exports = {
  listSubscriptions,
  createSubscription,
  toggleSubscription,
  getInsights,
  getAuditoria,
};