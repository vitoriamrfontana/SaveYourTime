/**
 * CONTROLLER - Detox de Assinaturas
 *
 * Responsável só por orquestrar: chama o model, formata a resposta
 * com apiResponse() e delega erros para o middleware global via
 * asyncHandler/ApiError. Validação de entrada já veio pronta da
 * camada de middleware (validateSubscription.js).
 *
 * Sprint 4: as taxas (CDI e IPCA) vêm do Banco Central pelo taxasService e são
 * passadas ao model, que continua só com cálculos, sem acesso à internet.
 */

const subscriptionsModel = require("../models/subscriptionsModel");
const { buscarNoCatalogo } = require("../models/subscriptionsCatalog");
const UserModel = require("../models/userModel"); // somente leitura (valorHora e salário do Perfil)
const taxasService = require("../services/taxasService");
const ApiError = require("../utils/ApiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Sprint 4: janela padrão do card de próximas cobranças
const DIAS_PROXIMAS_COBRANCAS = 7;

function montarInsights(perfil, taxas) {
  const { valorHora, horasMensais } = perfil;
  return {
    horasTrabalho: subscriptionsModel.calcularHorasTrabalho({ valorHora, horasMensais }),
    custoInvisivel: subscriptionsModel.calcularCustoInvisivel({ ipca12m: taxas.ipca12m, taxaAnual: taxas.cdiAnual }),
    projecaoJuros: subscriptionsModel.calcularProjecaoJuros(taxas.cdiAnual, {
      fonteTaxa: taxas.fonte,
      taxaAtualizadaEm: taxas.atualizadoEm,
    }),
    categorias: subscriptionsModel.CATEGORIAS,
  };
}

// Sprint 4: tudo o que a tela do Detox mostra, numa resposta só. Sai em
// GET /overview e junto das mutações novas, para o app não recarregar 4 vezes.
async function montarResumo() {
  const taxas = await taxasService.obterTaxas();
  const perfil = UserModel.getProfile();
  return {
    subscriptions: subscriptionsModel.getSubscriptions({ perfil }),
    economia: subscriptionsModel.getEconomiaTotal(),
    insights: montarInsights(perfil, taxas),
    auditoria: subscriptionsModel.getAuditoria(),
    redundancias: subscriptionsModel.detectarRedundancias(),
    proximasCobrancas: subscriptionsModel.getProximasCobrancas({ dias: DIAS_PROXIMAS_COBRANCAS }),
    limite: subscriptionsModel.calcularLimiteDeGasto({ salario: perfil.salario }),
    taxas,
  };
}

// Sprint 4: resposta das mutações novas: a assinatura e o resumo recalculado.
// O model devolve null (id inexistente) ou { erro } (regra de negócio).
async function responderMutacao(res, id, resultado) {
  if (!resultado) {
    throw ApiError.notFound(`Assinatura com id ${id} não encontrada.`);
  }
  if (resultado.erro) {
    throw ApiError.badRequest(resultado.erro);
  }
  return apiResponse(res, 200, { assinatura: resultado, resumo: await montarResumo() });
}

// GET /api/subscriptions
const listSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = subscriptionsModel.getSubscriptions({ perfil: UserModel.getProfile() });
  const economia = subscriptionsModel.getEconomiaTotal();

  return apiResponse(res, 200, { subscriptions, economia });
});

// POST /api/subscriptions
// Sprint 4: aceita também valorCobrado + ciclo, dia ou data da próxima cobrança,
// divisão do plano, teste grátis e o serviço do catálogo. A resposta continua
// sendo só a assinatura.
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
    catalogoId,
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
    catalogoId,
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
  const taxas = await taxasService.obterTaxas();
  return apiResponse(res, 200, montarInsights(UserModel.getProfile(), taxas));
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

// POST /api/subscriptions/:id/usage-check  body: { frequenciaUso } ou { resposta }
// Sprint 3: custo por uso = mensalidade / quantas vezes usou no mês.
// Sprint 4: nos tipos sem "uso" contável, a resposta da pergunta do tipo.
const calcularCustoUso = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { frequenciaUso, resposta } = req.body;
  const resultado = subscriptionsModel.verificarUso(id, { frequenciaUso, resposta });

  if (!resultado) {
    throw ApiError.notFound(`Assinatura com id ${id} não encontrada.`);
  }

  // Sprint 4: só para assinatura ativa ou em teste, e com o dado que o tipo pede
  if (resultado.erro) {
    throw ApiError.badRequest(resultado.erro);
  }

  return apiResponse(res, 200, resultado);
});

// GET /api/subscriptions/overview
// Sprint 4: a tela inteira do Detox numa chamada
const getOverview = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, await montarResumo());
});

// GET /api/subscriptions/meta
// Sprint 4: categorias, tipos, ciclos, status, rótulos, limites e checklist
const getMeta = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, subscriptionsModel.getMeta());
});

// GET /api/subscriptions/catalog?q=net
// Sprint 4: autocomplete do cadastro (sem q, devolve o catálogo inteiro)
const buscarCatalogo = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, buscarNoCatalogo(req.query.q));
});

// GET /api/subscriptions/upcoming?dias=7
// Sprint 4: cobranças, fins de teste grátis e retomadas dos próximos dias
const getProximasCobrancas = asyncHandler(async (req, res) => {
  const dias = req.query.dias ? Number(req.query.dias) : DIAS_PROXIMAS_COBRANCAS;
  return apiResponse(res, 200, subscriptionsModel.getProximasCobrancas({ dias }));
});

// GET /api/subscriptions/review
// Sprint 4: "Detox do mês", um cartão por assinatura ativa, com sugestão
const getRevisao = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, subscriptionsModel.getRevisaoDoMes({ perfil: UserModel.getProfile() }));
});

// GET /api/subscriptions/settings
// Sprint 4: meta de gasto com assinaturas, em % da renda
const getConfiguracoes = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, subscriptionsModel.getConfiguracoes());
});

// PATCH /api/subscriptions/settings  body: { limitePercentualRenda }
const atualizarConfiguracoes = asyncHandler(async (req, res) => {
  const { limitePercentualRenda } = req.body;
  const configuracoes = subscriptionsModel.atualizarConfiguracoes({ limitePercentualRenda });
  return apiResponse(res, 200, { configuracoes, resumo: await montarResumo() });
});

// GET /api/subscriptions/:id/cancel-guide
// Sprint 4: passo a passo, link oficial e direitos do consumidor
const getGuiaCancelamento = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const guia = subscriptionsModel.getGuiaDeCancelamento(id);

  if (!guia) {
    throw ApiError.notFound(`Assinatura com id ${id} não encontrada.`);
  }

  return apiResponse(res, 200, guia);
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
  buscarCatalogo,
  getProximasCobrancas,
  getRevisao,
  getConfiguracoes,
  atualizarConfiguracoes,
  getGuiaCancelamento,
  updateSubscription,
  deleteSubscription,
  alterarStatus,
};
