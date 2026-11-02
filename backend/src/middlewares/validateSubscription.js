const ApiError = require("../utils/ApiError");
const { ehDataValida, hoje, adicionarDias } = require("../utils/datas");
const {
  CATEGORIAS,
  TIPOS_POR_CATEGORIA,
  CICLOS,
  STATUS,
  VALOR_MENSAL_MAXIMO,
  NOME_MAXIMO,
  COMPARTILHADA_COM_MAXIMO,
  LIMITE_PERCENTUAL_RENDA_MAXIMO,
} = require("../models/subscriptionsModel");
const { servicoPorId } = require("../models/subscriptionsCatalog");

// Sprint 4: pausa e teste grátis podem ir no máximo até um ano à frente
const DIAS_MAXIMOS_A_FRENTE = 366;

// Sprint 4: campos que o PATCH /:id aceita (o status tem rota própria)
const CAMPOS_EDITAVEIS = [
  "nome",
  "valorCobrado",
  "ciclo",
  "diaCobranca",
  "proximaCobranca",
  "compartilhadaCom",
  "categoria",
  "tipo",
];

// Sprint 4: aceita só número finito ou texto decimal com ponto ("39.90"). O Number()
// sozinho deixava passar true (= 1), [5] (= 5), "0x10" (= 16) e "Infinity".
function lerValorMonetario(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor === "string" && /^-?\d+(\.\d+)?$/.test(valor.trim())) return Number(valor);
  return null;
}

function temAteDuasCasas(valor) {
  return Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6;
}

// Cada função abaixo devolve a mensagem de erro do campo, ou null se ele estiver ok

function erroNome(nome) {
  if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
    return "O campo 'nome' é obrigatório e deve ser um texto.";
  }
  if (nome.trim().length > NOME_MAXIMO) {
    return `O campo 'nome' deve ter no máximo ${NOME_MAXIMO} caracteres.`;
  }
  return null;
}

function erroValor(campo, valor, { teto } = {}) {
  // Sprint 4: "39,90" ganha mensagem própria, porque é o erro mais comum de quem digita em pt-BR
  if (typeof valor === "string" && valor.includes(",")) {
    return `Use ponto como separador decimal no campo '${campo}' (ex.: 39.90).`;
  }
  const numero = lerValorMonetario(valor);
  if (numero === null) return `O campo '${campo}' é obrigatório e deve ser numérico.`;
  if (numero <= 0) return `O campo '${campo}' deve ser maior que zero.`;
  if (teto && numero > teto) {
    return `O campo '${campo}' deve ser de no máximo R$ ${teto.toLocaleString("pt-BR")}.`;
  }
  if (!temAteDuasCasas(numero)) return `O campo '${campo}' deve ter no máximo 2 casas decimais.`;
  return null;
}

// Sprint 4: o valor vem como valorCobrado (o valor de cada cobrança, formato novo) ou
// como valorMensal (formato antigo, que só existe para cobrança mensal sem divisão).
// O teto do valorCobrado depende do ciclo e fica com o model.
function erroValorDoCadastro({ valorMensal, valorCobrado, ciclo, compartilhadaCom }) {
  if (valorCobrado != null && valorMensal != null) {
    return "Envie só um dos campos: 'valorCobrado' ou 'valorMensal'.";
  }
  if (valorCobrado != null) return erroValor("valorCobrado", valorCobrado);
  if ((ciclo != null && ciclo !== "mensal") || compartilhadaCom > 0) {
    return "Com ciclo diferente de mensal ou plano dividido, informe 'valorCobrado' (o valor de cada cobrança).";
  }
  return erroValor("valorMensal", valorMensal, { teto: VALOR_MENSAL_MAXIMO });
}

function erroCiclo(ciclo) {
  if (ciclo == null || CICLOS.includes(ciclo)) return null;
  return `O campo 'ciclo' deve ser um destes: ${CICLOS.join(", ")}.`;
}

function erroInteiro(campo, valor, minimo, maximo) {
  if (valor == null) return null;
  if (!Number.isInteger(valor) || valor < minimo || valor > maximo) {
    return `O campo '${campo}' deve ser um número inteiro entre ${minimo} e ${maximo}.`;
  }
  return null;
}

function erroData(campo, valor, { futura = false } = {}) {
  if (valor == null) return null;
  if (!ehDataValida(valor)) return `O campo '${campo}' deve ser uma data válida no formato AAAA-MM-DD.`;
  if (futura) {
    const dataHoje = hoje();
    if (valor <= dataHoje) return `O campo '${campo}' deve ser uma data futura.`;
    if (valor > adicionarDias(dataHoje, DIAS_MAXIMOS_A_FRENTE)) {
      return `O campo '${campo}' deve ser no máximo daqui a um ano.`;
    }
  }
  return null;
}

// Sprint 4: no mensal basta o dia; nos outros ciclos o dia não diz em que mês (ou, no
// semanal, em que dia da semana) cai a cobrança, então é preciso a data da próxima
function erroCalendario(ciclo, diaCobranca, proximaCobranca) {
  if (diaCobranca != null && proximaCobranca == null && (ciclo ?? "mensal") !== "mensal") {
    return "Para esse ciclo, informe 'proximaCobranca' (a data da próxima cobrança) em vez de 'diaCobranca'.";
  }
  return null;
}

// Sprint 3: o tipo é opcional, mas se vier precisa pertencer à categoria.
// Sprint 4: sem categoria, basta o tipo existir (o model deduz a categoria pelo tipo).
function erroCategoriaETipo(categoria, tipo) {
  if (categoria != null && !CATEGORIAS.includes(categoria)) {
    return `O campo 'categoria' deve ser um destes: ${CATEGORIAS.join(", ")}.`;
  }
  if (tipo == null) return null;

  const tiposAceitos =
    categoria == null ? Object.values(TIPOS_POR_CATEGORIA).flat() : TIPOS_POR_CATEGORIA[categoria];
  if (tiposAceitos.includes(tipo)) return null;

  const problema =
    categoria == null
      ? "O 'tipo' informado não existe."
      : "O campo 'tipo' não pertence à categoria informada.";
  return `${problema} Tipos válidos: ${tiposAceitos.join(", ") || "nenhum"}.`;
}

// Sprint 4: serviço escolhido no autocomplete precisa existir no catálogo
function erroCatalogo(catalogoId) {
  if (catalogoId == null || servicoPorId(catalogoId)) return null;
  return "O 'catalogoId' informado não existe no catálogo.";
}

// Sprint 4: o cadastro nasce ativo ou em teste grátis (com a data em que o teste acaba)
function erroStatusInicial(status, fimTeste) {
  if (status == null || status === "ativa") return null;
  if (status !== "teste") return "No cadastro, o campo 'status' só pode ser 'ativa' ou 'teste'.";
  if (fimTeste == null) return "Informe 'fimTeste': a data em que o teste grátis acaba e a cobrança começa.";
  return erroData("fimTeste", fimTeste, { futura: true });
}

function responder(next, erro) {
  return erro ? next(ApiError.badRequest(erro)) : next();
}

/**
 * validateCreateSubscription - valida o payload de POST /api/subscriptions
 * ANTES de chegar no controller. Mantém o controller limpo, focado só
 * em orquestrar a chamada ao model.
 */
function validateCreateSubscription(req, res, next) {
  const body = req.body;
  return responder(
    next,
    erroNome(body.nome) ||
      erroValorDoCadastro(body) ||
      erroCiclo(body.ciclo) ||
      erroInteiro("diaCobranca", body.diaCobranca, 1, 31) ||
      erroData("proximaCobranca", body.proximaCobranca) ||
      erroCalendario(body.ciclo, body.diaCobranca, body.proximaCobranca) ||
      erroInteiro("compartilhadaCom", body.compartilhadaCom, 0, COMPARTILHADA_COM_MAXIMO) ||
      erroCategoriaETipo(body.categoria, body.tipo) ||
      erroCatalogo(body.catalogoId) ||
      erroStatusInicial(body.status, body.fimTeste)
  );
}

/**
 * validateUpdateSubscription - Sprint 4: valida o PATCH /api/subscriptions/:id.
 * Todos os campos são opcionais, mas pelo menos um precisa vir.
 */
function validateUpdateSubscription(req, res, next) {
  const body = req.body;

  if (body.valorMensal !== undefined) {
    return next(ApiError.badRequest("Para mudar o valor, use 'valorCobrado' (o valor de cada cobrança)."));
  }
  if (body.status !== undefined) {
    return next(ApiError.badRequest("Para mudar o status, use PATCH /api/subscriptions/:id/status."));
  }
  if (!CAMPOS_EDITAVEIS.some((campo) => body[campo] !== undefined)) {
    return next(ApiError.badRequest(`Informe ao menos um destes campos: ${CAMPOS_EDITAVEIS.join(", ")}.`));
  }

  return responder(
    next,
    (body.nome !== undefined ? erroNome(body.nome) : null) ||
      (body.valorCobrado !== undefined ? erroValor("valorCobrado", body.valorCobrado) : null) ||
      erroCiclo(body.ciclo) ||
      erroInteiro("diaCobranca", body.diaCobranca, 1, 31) ||
      erroData("proximaCobranca", body.proximaCobranca) ||
      erroCalendario(body.ciclo, body.diaCobranca, body.proximaCobranca) ||
      erroInteiro("compartilhadaCom", body.compartilhadaCom, 0, COMPARTILHADA_COM_MAXIMO) ||
      erroCategoriaETipo(body.categoria, body.tipo)
  );
}

/**
 * validateStatusChange - Sprint 4: valida o PATCH /api/subscriptions/:id/status.
 * Pausa precisa da data de retomada; teste grátis, da data em que acaba.
 */
function validateStatusChange(req, res, next) {
  const { status, pausadaAte, fimTeste } = req.body;

  let erro = null;
  if (!STATUS.includes(status)) {
    erro = `O campo 'status' deve ser um destes: ${STATUS.join(", ")}.`;
  } else if (status === "pausada") {
    erro =
      pausadaAte == null
        ? "Informe 'pausadaAte': a data em que a assinatura volta a ser cobrada."
        : erroData("pausadaAte", pausadaAte, { futura: true });
  } else if (status === "teste") {
    erro =
      fimTeste == null
        ? "Informe 'fimTeste': a data em que o teste grátis acaba e a cobrança começa."
        : erroData("fimTeste", fimTeste, { futura: true });
  }

  return responder(next, erro);
}

/**
 * validateUpcomingQuery - Sprint 4: valida o ?dias= de GET /api/subscriptions/upcoming.
 */
function validateUpcomingQuery(req, res, next) {
  const { dias } = req.query;
  if (dias === undefined) return next();

  const numero = Number(dias);
  if (!/^\d+$/.test(String(dias)) || numero < 1 || numero > 90) {
    return next(ApiError.badRequest("O parâmetro 'dias' deve ser um número inteiro entre 1 e 90."));
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
 * validateSettings - Sprint 4: valida o PATCH /api/subscriptions/settings
 * (meta de gasto com assinaturas, em % da renda).
 */
function validateSettings(req, res, next) {
  const { limitePercentualRenda } = req.body;
  const valor = typeof limitePercentualRenda === "number" ? limitePercentualRenda : NaN;

  if (
    !Number.isFinite(valor) ||
    valor < 1 ||
    valor > LIMITE_PERCENTUAL_RENDA_MAXIMO ||
    Math.abs(valor * 10 - Math.round(valor * 10)) > 1e-9
  ) {
    return next(
      ApiError.badRequest(
        `O campo 'limitePercentualRenda' deve ser um número entre 1 e ${LIMITE_PERCENTUAL_RENDA_MAXIMO}, com até 1 casa decimal.`
      )
    );
  }
  next();
}

/**
 * validateCatalogQuery - Sprint 4: valida o ?q= de GET /api/subscriptions/catalog.
 */
function validateCatalogQuery(req, res, next) {
  const { q } = req.query;
  if (q !== undefined && (typeof q !== "string" || q.length > NOME_MAXIMO)) {
    return next(ApiError.badRequest(`O parâmetro 'q' deve ser um texto de até ${NOME_MAXIMO} caracteres.`));
  }
  next();
}

/**
 * validateUsageCheck - valida o payload de POST /api/subscriptions/:id/usage-check.
 * frequenciaUso = quantas vezes a pessoa usou o serviço no último mês.
 * Sprint 4: nos tipos sem "uso" contável (seguro, tarifa, cartão, nuvem) vem a
 * resposta da pergunta (true ou false). Qual dos dois o tipo pede, o model decide.
 */
function validateUsageCheck(req, res, next) {
  const { frequenciaUso, resposta } = req.body;

  if (resposta !== undefined && typeof resposta !== "boolean") {
    return next(ApiError.badRequest("O campo 'resposta' deve ser true ou false."));
  }
  if (frequenciaUso === undefined && resposta !== undefined) return next();

  if (
    frequenciaUso === undefined ||
    frequenciaUso === null ||
    typeof frequenciaUso === "boolean" ||
    String(frequenciaUso).trim() === ""
  ) {
    return next(
      ApiError.badRequest("O campo 'frequenciaUso' é obrigatório (ou 'resposta', nos tipos que têm pergunta).")
    );
  }

  const usos = Number(frequenciaUso);
  if (!Number.isInteger(usos) || usos < 0 || usos > 1000) {
    return next(
      ApiError.badRequest("O campo 'frequenciaUso' deve ser um número inteiro entre 0 e 1000.")
    );
  }

  next();
}

module.exports = {
  validateCreateSubscription,
  validateUpdateSubscription,
  validateStatusChange,
  validateUpcomingQuery,
  validateSettings,
  validateCatalogQuery,
  validateIdParam,
  validateUsageCheck,
};
