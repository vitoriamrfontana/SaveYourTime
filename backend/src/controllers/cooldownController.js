/**
 * CONTROLLER - Trava de Compras por Impulso (Cooldown 48h)
 * Integrante 4 - Trava Cooldown 48h
 *
 * Valida a entrada, injeta o perfil do usuário (salário e valor-hora, que o
 * motor de risco precisa) e orquestra as chamadas ao model. Respostas sempre
 * pelo apiResponse() e erros delegados ao errorHandler global via
 * asyncHandler/ApiError.
 */

const cooldownModel = require("../models/cooldownModel");
const UserModel = require("../models/userModel"); // somente leitura (salário / valorHora)
const ApiError = require("../utils/ApiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Contexto que o model usa para calcular risco e tempo restante
function contexto() {
  return { perfil: UserModel.getProfile(), agora: new Date() };
}

function validarNovoDesejo({ item, preco, categoria }) {
  if (!item || typeof item !== "string" || item.trim().length === 0) {
    throw ApiError.badRequest("O campo 'item' é obrigatório e deve ser um texto.");
  }

  if (item.trim().length > 60) {
    throw ApiError.badRequest("O campo 'item' deve ter no máximo 60 caracteres.");
  }

  if (preco === undefined || preco === null || isNaN(Number(preco))) {
    throw ApiError.badRequest("O campo 'preco' é obrigatório e deve ser numérico.");
  }

  if (Number(preco) <= 0) {
    throw ApiError.badRequest("O campo 'preco' deve ser maior que zero.");
  }

  if (categoria !== undefined && !cooldownModel.CATEGORIAS.includes(categoria)) {
    throw ApiError.badRequest(
      `O campo 'categoria' deve ser um destes: ${cooldownModel.CATEGORIAS.join(", ")}.`
    );
  }
}

function validarQuiz(quiz) {
  if (!quiz || typeof quiz !== "object" || Array.isArray(quiz)) {
    throw ApiError.badRequest("O campo 'quiz' deve ser um objeto com as respostas do questionário.");
  }

  // null é resposta em branco (pergunta que o usuário pulou), não valor inválido
  const usosValidos = Object.keys(cooldownModel.USOS_PREVISTOS);
  const usoInformado = quiz.usoPrevisto !== undefined && quiz.usoPrevisto !== null;
  if (usoInformado && !usosValidos.includes(String(quiz.usoPrevisto))) {
    throw ApiError.badRequest(`O campo 'usoPrevisto' deve ser um destes: ${usosValidos.join(", ")}.`);
  }
}

function validarId(id) {
  if (!id || isNaN(Number(id))) {
    throw ApiError.badRequest("O parâmetro 'id' deve ser numérico.");
  }
}

// GET /api/cooldown
// Itens em quarentena + resumo (é o que a aba Cooldown 48h carrega de uma vez)
const listItems = asyncHandler(async (req, res) => {
  const ctx = contexto();

  return apiResponse(res, 200, {
    items: cooldownModel.getItems(ctx),
    resumo: cooldownModel.getResumo(ctx),
    categorias: cooldownModel.CATEGORIAS,
    marcos: cooldownModel.MARCOS,
  });
});

// GET /api/cooldown/:id
const getItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validarId(id);

  const item = cooldownModel.getItemById(id, contexto());
  if (!item) {
    throw ApiError.notFound(`Desejo com id ${id} não encontrado.`);
  }

  return apiResponse(res, 200, item);
});

// POST /api/cooldown
// Entra na quarentena já com o questionário reflexivo (se respondido no modal)
const createItem = asyncHandler(async (req, res) => {
  const { item, preco, categoria, quiz } = req.body;
  validarNovoDesejo({ item, preco, categoria });
  if (quiz !== undefined) validarQuiz(quiz);

  const ctx = contexto();
  const novoItem = cooldownModel.addItem({ item, preco, categoria, quiz }, ctx);

  return apiResponse(res, 201, { item: novoItem, resumo: cooldownModel.getResumo(ctx) });
});

// PATCH /api/cooldown/:id/quiz
// Respostas reflexivas dos marcos (12h / 24h / 48h) recalculam o score
const responderQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validarId(id);
  validarQuiz(req.body);

  const ctx = contexto();
  const itemAtualizado = cooldownModel.responderQuiz(id, req.body, ctx);

  if (!itemAtualizado) {
    throw ApiError.notFound(`Desejo com id ${id} não encontrado.`);
  }

  return apiResponse(res, 200, { item: itemAtualizado, resumo: cooldownModel.getResumo(ctx) });
});

/**
 * Fábrica das duas rotas de auditoria de desfecho: desistiu x comprou.
 * Ambas encerram a quarentena; só a desistência soma economia.
 */
function encerrarCom(tipoDesfecho) {
  return asyncHandler(async (req, res) => {
    const { id } = req.params;
    validarId(id);

    const ctx = contexto();
    const resultado = cooldownModel.registrarDesfecho(id, tipoDesfecho, ctx);

    if (!resultado) {
      throw ApiError.notFound(`Desejo com id ${id} não encontrado.`);
    }

    if (resultado.jaEncerrado) {
      throw ApiError.badRequest(
        `A quarentena do desejo ${id} já foi encerrada como '${resultado.item.desfecho.tipo}'.`
      );
    }

    return apiResponse(res, 200, {
      item: resultado.item,
      resumo: cooldownModel.getResumo(ctx),
      auditoria: cooldownModel.getAuditoria(),
    });
  });
}

// PATCH /api/cooldown/:id/desisti
const registrarDesistencia = encerrarCom(cooldownModel.DESFECHOS.DESISTIU);

// PATCH /api/cooldown/:id/comprei
const registrarCompra = encerrarCom(cooldownModel.DESFECHOS.COMPROU);

// GET /api/cooldown/auditoria
// Histórico de desfechos + montante total poupado pelas compras canceladas
const getAuditoria = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, cooldownModel.getAuditoria());
});

module.exports = {
  listItems,
  getItem,
  createItem,
  responderQuiz,
  registrarDesistencia,
  registrarCompra,
  getAuditoria,
};
