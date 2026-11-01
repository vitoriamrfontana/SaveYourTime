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

// Sprint 4: janela padrão do card de próximas cobranças
const DIAS_PROXIMAS_COBRANCAS = 7;

function montarInsights() {
  const { valorHora, horasMensais } = UserModel.getProfile();
  return {
    horasTrabalho: subscriptionsModel.calcularHorasTrabalho({ valorHora, horasMensais }),
    custoInvisivel: subscriptionsModel.calcularCustoInvisivel(),
    projecaoJuros: subscriptionsModel.calcularProjecaoJuros(),
    categorias: subscriptionsModel.CATEGORIAS,
  };
}

// Sprint 4: tudo o que a tela do Detox mostra, numa resposta só. Sai em
// GET /overview e junto das mutações novas, para o app não recarregar 4 vezes.
function montarResumo() {
  return {
    subscriptions: subscriptionsModel.getSubscriptions(),
    economia: subscriptionsModel.getEconomiaTotal(),
    insights: montarInsights(),
    auditoria: subscriptionsModel.getAuditoria(),
    redundancias: subscriptionsModel.detectarRedundancias(),
    proximasCobrancas: subscriptionsModel.getProximasCobrancas({ dias: DIAS_PROXIMAS_COBRANCAS }),
  };
}

// Sprint 4: resposta das mutações novas: a assinatura e o resumo recalculado.
// O model devolve null (id inexistente) ou { erro } (regra de negócio).
function responderMutacao(res, id, resultado) {
  if (!resultado) {
    throw ApiError.notFound(`Assinatura com id ${id} não encontrada.`);
  }
  if (resultado.erro) {
    throw ApiError.badRequest(resultado.erro);
  }
  return apiResponse(res, 200, { assinatura: resultado, resumo: montarResumo() });
}

// GET /api/subscriptions
const listSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = subscriptionsModel.getSubscriptions();
  const economia = subscriptionsModel.getEconomiaTotal();

  return apiResponse(res, 200, { subscriptions, economia });
});

// POST /api/subscriptions
// Sprint 4: aceita também valorCobrado + ciclo, dia ou data da próxima cobrança,
// divisão do plano e teste grátis. A resposta continua sendo só a assinatura.
const createSubscription = asyncHandler(async (req, res) => {
  const {
    nome,
    valorMensal,
    valorCobrado,
    ciclo,
    diaCobranca,
    proximaCobranca,
    compartilhadaCom,
    categoria,
    tipo,
    status,
    fimTeste,
  } = req.body;
  const novaAssinatura = subscriptionsModel.addSubscription({
    nome,
    valorMensal,
    valorCobrado,
    ciclo,
    diaCobranca,
    proximaCobranca,
    compartilhadaCom,
    categoria,
    tipo,
    status,
    fimTeste,
  });

  // Sprint 4: o teto vale para o equivalente mensal, que depende do ciclo (regra do model)
  if (novaAssinatura.erro) {
    throw ApiError.badRequest(novaAssinatura.erro);
  }

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
  return apiResponse(res, 200, montarInsights());
});

// GET /api/subscriptions/auditoria
const getAuditoria = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, subscriptionsModel.getAuditoria());
});

// GET /api/subscriptions/redundancies
// Sprint 3: grupos de assinaturas ativas que fazem a mesma coisa (ex.: dois streamings de vídeo)
const detectarRedundancias = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, subscriptionsModel.detectarRedundancias());
});

// POST /api/subscriptions/:id/usage-check  body: { frequenciaUso }
// Sprint 3: custo por uso = mensalidade / quantas vezes usou no mês
const calcularCustoUso = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const resultado = subscriptionsModel.calcularCustoUso(id, req.body.frequenciaUso);

  if (!resultado) {
    throw ApiError.notFound(`Assinatura com id ${id} não encontrada.`);
  }

  // Sprint 4: custo por uso só vale para assinatura ativa ou em teste grátis
  if (resultado.erro) {
    throw ApiError.badRequest(resultado.erro);
  }

  return apiResponse(res, 200, resultado);
});

// GET /api/subscriptions/overview
// Sprint 4: a tela inteira do Detox numa chamada
const getOverview = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, montarResumo());
});

// GET /api/subscriptions/meta
// Sprint 4: categorias, tipos, ciclos, status, rótulos, limites e checklist
const getMeta = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, subscriptionsModel.getMeta());
});

// GET /api/subscriptions/upcoming?dias=7
// Sprint 4: cobranças, fins de teste grátis e retomadas dos próximos dias
const getProximasCobrancas = asyncHandler(async (req, res) => {
  const dias = req.query.dias ? Number(req.query.dias) : DIAS_PROXIMAS_COBRANCAS;
  return apiResponse(res, 200, subscriptionsModel.getProximasCobrancas({ dias }));
});

// PATCH /api/subscriptions/:id
// Sprint 4: edição; mudança de valor vai para o histórico de preços e a auditoria
const updateSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, valorCobrado, ciclo, diaCobranca, proximaCobranca, compartilhadaCom, categoria, tipo } =
    req.body;
  const resultado = subscriptionsModel.updateSubscription(id, {
    nome,
    valorCobrado,
    ciclo,
    diaCobranca,
    proximaCobranca,
    compartilhadaCom,
    categoria,
    tipo,
  });

  return responderMutacao(res, id, resultado);
});

// DELETE /api/subscriptions/:id
// Sprint 4: remove um cadastro errado (diferente de cancelar)
const deleteSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  return responderMutacao(res, id, subscriptionsModel.removeSubscription(id));
});

// PATCH /api/subscriptions/:id/status  body: { status, pausadaAte?, fimTeste? }
// Sprint 4: ativa, teste grátis, pausada ou cancelada
const alterarStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, pausadaAte, fimTeste } = req.body;
  return responderMutacao(res, id, subscriptionsModel.alterarStatus(id, { status, pausadaAte, fimTeste }));
});

module.exports = {
  listSubscriptions,
  createSubscription,
  toggleSubscription,
  getInsights,
  getAuditoria,
  detectarRedundancias,
  calcularCustoUso,
  // Sprint 4
  getOverview,
  getMeta,
  getProximasCobrancas,
  updateSubscription,
  deleteSubscription,
  alterarStatus,
};
