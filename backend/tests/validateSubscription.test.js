const {
  validateCreateSubscription,
  validateUpdateSubscription,
  validateStatusChange,
  validateUpcomingQuery,
  validateSettings,
  validateCatalogQuery,
  validateIdParam,
  validateUsageCheck,
} = require("../src/middlewares/validateSubscription");
const ApiError = require("../src/utils/ApiError");
const { hoje, adicionarDias } = require("../src/utils/datas");

// Datas relativas ao dia em que o teste roda, porque a validação compara com hoje
const AMANHA = adicionarDias(hoje(), 1);
const ONTEM = adicionarDias(hoje(), -1);
const DAQUI_A_DOIS_ANOS = adicionarDias(hoje(), 800);

// Roda o middleware e devolve o que ele passou para next(): undefined (ok) ou o erro
function validar(middleware, req) {
  const next = jest.fn();
  middleware({ body: {}, params: {}, query: {}, ...req }, {}, next);
  expect(next).toHaveBeenCalledTimes(1);
  return next.mock.calls[0][0];
}

describe("validateCreateSubscription", () => {
  const criar = (body) => validar(validateCreateSubscription, { body });

  it.each([
    ["número", { nome: "Netflix", valorMensal: 39.9 }],
    ["texto com ponto decimal", { nome: "Netflix", valorMensal: "39.90" }],
    ["valor no teto", { nome: "Plano", valorMensal: 10000 }],
    ["nome com 60 caracteres", { nome: "a".repeat(60), valorMensal: 10 }],
    ["categoria e tipo compatíveis", { nome: "Spotify", valorMensal: 21.9, categoria: "streaming", tipo: "musica" }],
    ["tipo sem categoria (Sprint 4)", { nome: "Netflix", valorMensal: 39.9, tipo: "video" }],
  ])("aceita %s", (_, body) => {
    expect(criar(body)).toBeUndefined();
  });

  it.each([
    ["valorMensal true", { nome: "X", valorMensal: true }, "numérico"],
    ['valorMensal "39,90"', { nome: "X", valorMensal: "39,90" }, "ponto como separador"],
    ["valorMensal -5", { nome: "X", valorMensal: -5 }, "maior que zero"],
    ["valorMensal 0", { nome: "X", valorMensal: 0 }, "maior que zero"],
    ["valorMensal acima do teto", { nome: "X", valorMensal: 10000.01 }, "no máximo R$ 10.000"],
    ["valorMensal com 3 casas", { nome: "X", valorMensal: 39.999 }, "2 casas decimais"],
    ['valorMensal "Infinity"', { nome: "X", valorMensal: "Infinity" }, "numérico"],
    ["valorMensal hexadecimal", { nome: "X", valorMensal: "0x10" }, "numérico"],
    ["valorMensal em array", { nome: "X", valorMensal: [5] }, "numérico"],
    ["valorMensal ausente", { nome: "X" }, "obrigatório"],
    ["nome vazio", { nome: "", valorMensal: 10 }, "'nome' é obrigatório"],
    ["nome só com espaços", { nome: "   ", valorMensal: 10 }, "'nome' é obrigatório"],
    ["nome com 61 caracteres", { nome: "a".repeat(61), valorMensal: 10 }, "60 caracteres"],
    ["nome que não é texto", { nome: 123, valorMensal: 10 }, "'nome' é obrigatório"],
    ["categoria inexistente", { nome: "X", valorMensal: 10, categoria: "xyz" }, "'categoria'"],
    ["tipo de outra categoria", { nome: "X", valorMensal: 10, categoria: "saude", tipo: "video" }, "não pertence"],
    ["tipo inexistente sem categoria", { nome: "X", valorMensal: 10, tipo: "xyz" }, "não existe"],
  ])("recusa %s", (_, body, trecho) => {
    const erro = criar(body);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.statusCode).toBe(400);
    expect(erro.message).toContain(trecho);
  });
});

describe("validateIdParam", () => {
  const comId = (id) => validar(validateIdParam, { params: { id } });

  it("aceita inteiro positivo", () => {
    expect(comId("7")).toBeUndefined();
  });

  it.each(["0", "-1", "1.5", "abc"])("recusa %p", (id) => {
    expect(comId(id).statusCode).toBe(400);
  });
});

describe("validateUsageCheck", () => {
  const comUsos = (frequenciaUso) => validar(validateUsageCheck, { body: { frequenciaUso } });

  it.each([0, 1, 1000, "5"])("aceita %p", (usos) => {
    expect(comUsos(usos)).toBeUndefined();
  });

  it.each([-1, 1001, 1.5, true, "", null, undefined, "abc"])("recusa %p", (usos) => {
    expect(comUsos(usos).statusCode).toBe(400);
  });
});

// Sprint 4

describe("validateCreateSubscription (formato novo)", () => {
  const criar = (body) => validar(validateCreateSubscription, { body });

  it.each([
    ["ciclo anual com a próxima cobrança", { nome: "X", valorCobrado: 119.9, ciclo: "anual", proximaCobranca: "2026-11-20" }],
    ["mensal com dia 31", { nome: "X", valorCobrado: 39.9, ciclo: "mensal", diaCobranca: 31 }],
    ["plano dividido", { nome: "X", valorCobrado: 60, compartilhadaCom: 2 }],
    ["teste grátis acabando amanhã", { nome: "X", valorCobrado: 30, status: "teste", fimTeste: AMANHA }],
    ["tipo nulo", { nome: "X", valorCobrado: 30, tipo: null }],
  ])("aceita %s", (_, body) => {
    expect(criar(body)).toBeUndefined();
  });

  it.each([
    ["valorCobrado e valorMensal juntos", { nome: "X", valorCobrado: 10, valorMensal: 10 }, "só um dos campos"],
    ["valorMensal com ciclo anual", { nome: "X", valorMensal: 10, ciclo: "anual" }, "valorCobrado"],
    ["valorMensal com plano dividido", { nome: "X", valorMensal: 10, compartilhadaCom: 1 }, "valorCobrado"],
    ["valorCobrado com vírgula", { nome: "X", valorCobrado: "39,90" }, "ponto como separador"],
    ["ciclo inexistente", { nome: "X", valorCobrado: 10, ciclo: "diario" }, "'ciclo'"],
    ["diaCobranca 0", { nome: "X", valorCobrado: 10, diaCobranca: 0 }, "entre 1 e 31"],
    ["diaCobranca 32", { nome: "X", valorCobrado: 10, diaCobranca: 32 }, "entre 1 e 31"],
    ["diaCobranca em texto", { nome: "X", valorCobrado: 10, diaCobranca: "5" }, "entre 1 e 31"],
    ["data que não existe", { nome: "X", valorCobrado: 10, proximaCobranca: "2026-02-30" }, "data válida"],
    ["data no formato brasileiro", { nome: "X", valorCobrado: 10, proximaCobranca: "20/11/2026" }, "AAAA-MM-DD"],
    ["dia de cobrança no ciclo anual", { nome: "X", valorCobrado: 10, ciclo: "anual", diaCobranca: 10 }, "proximaCobranca"],
    ["compartilhadaCom negativo", { nome: "X", valorCobrado: 10, compartilhadaCom: -1 }, "entre 0 e 20"],
    ["compartilhadaCom acima do limite", { nome: "X", valorCobrado: 10, compartilhadaCom: 21 }, "entre 0 e 20"],
    ["status pausada no cadastro", { nome: "X", valorCobrado: 10, status: "pausada" }, "'ativa' ou 'teste'"],
    ["teste sem fimTeste", { nome: "X", valorCobrado: 10, status: "teste" }, "fimTeste"],
    ["teste que já acabou", { nome: "X", valorCobrado: 10, status: "teste", fimTeste: ONTEM }, "data futura"],
    ["teste a mais de um ano", { nome: "X", valorCobrado: 10, status: "teste", fimTeste: DAQUI_A_DOIS_ANOS }, "um ano"],
  ])("recusa %s", (_, body, trecho) => {
    const erro = criar(body);

    expect(erro.statusCode).toBe(400);
    expect(erro.message).toContain(trecho);
  });
});

describe("validateUpdateSubscription", () => {
  const editar = (body) => validar(validateUpdateSubscription, { body });

  it.each([
    ["só o nome", { nome: "Novo nome" }],
    ["valor e ciclo", { valorCobrado: 119.9, ciclo: "anual" }],
    ["tirar o tipo", { tipo: null }],
  ])("aceita %s", (_, body) => {
    expect(editar(body)).toBeUndefined();
  });

  it.each([
    ["corpo vazio", {}, "ao menos um"],
    ["valorMensal", { valorMensal: 10 }, "valorCobrado"],
    ["status", { nome: "X", status: "cancelada" }, "/status"],
    ["nome só com espaços", { nome: " " }, "'nome'"],
    ["valor zero", { valorCobrado: 0 }, "maior que zero"],
    ["tipo de outra categoria", { categoria: "saude", tipo: "video" }, "não pertence"],
  ])("recusa %s", (_, body, trecho) => {
    const erro = editar(body);

    expect(erro.statusCode).toBe(400);
    expect(erro.message).toContain(trecho);
  });
});

describe("validateStatusChange", () => {
  const mudar = (body) => validar(validateStatusChange, { body });

  it.each([
    ["cancelar", { status: "cancelada" }],
    ["reativar", { status: "ativa" }],
    ["pausar até amanhã", { status: "pausada", pausadaAte: AMANHA }],
    ["teste grátis até amanhã", { status: "teste", fimTeste: AMANHA }],
  ])("aceita %s", (_, body) => {
    expect(mudar(body)).toBeUndefined();
  });

  it.each([
    ["status inexistente", { status: "suspensa" }, "'status'"],
    ["pausa sem data", { status: "pausada" }, "pausadaAte"],
    ["pausa com data passada", { status: "pausada", pausadaAte: ONTEM }, "data futura"],
    ["pausa a mais de um ano", { status: "pausada", pausadaAte: DAQUI_A_DOIS_ANOS }, "um ano"],
    ["teste sem data", { status: "teste" }, "fimTeste"],
  ])("recusa %s", (_, body, trecho) => {
    const erro = mudar(body);

    expect(erro.statusCode).toBe(400);
    expect(erro.message).toContain(trecho);
  });
});

describe("validateUpcomingQuery", () => {
  const comDias = (dias) => validar(validateUpcomingQuery, { query: { dias } });

  it.each([undefined, "1", "7", "90"])("aceita %p", (dias) => {
    expect(comDias(dias)).toBeUndefined();
  });

  it.each(["0", "91", "abc", "1.5", "-3"])("recusa %p", (dias) => {
    expect(comDias(dias).statusCode).toBe(400);
  });
});

describe("validateCreateSubscription (catálogo)", () => {
  const criar = (body) => validar(validateCreateSubscription, { body });

  it("aceita serviço que existe no catálogo", () => {
    expect(criar({ nome: "Netflix", valorCobrado: 25.9, catalogoId: "netflix" })).toBeUndefined();
  });

  it("recusa serviço que não existe", () => {
    expect(criar({ nome: "X", valorCobrado: 10, catalogoId: "nao-existe" }).message).toContain("catálogo");
  });
});

describe("validateUsageCheck (resposta da pergunta)", () => {
  const verificar = (body) => validar(validateUsageCheck, { body });

  it.each([true, false])("aceita resposta %p", (resposta) => {
    expect(verificar({ resposta })).toBeUndefined();
  });

  it.each([{ resposta: "sim" }, { resposta: 1 }, { resposta: true, frequenciaUso: -1 }, {}])("recusa %p", (body) => {
    expect(verificar(body).statusCode).toBe(400);
  });
});

describe("validateSettings", () => {
  const configurar = (limitePercentualRenda) => validar(validateSettings, { body: { limitePercentualRenda } });

  it.each([1, 5, 7.5, 50])("aceita %p", (valor) => {
    expect(configurar(valor)).toBeUndefined();
  });

  it.each([0, 51, 2.55, "5", null, undefined])("recusa %p", (valor) => {
    expect(configurar(valor).statusCode).toBe(400);
  });
});

describe("validateCatalogQuery", () => {
  const buscar = (q) => validar(validateCatalogQuery, { query: { q } });

  it("aceita texto curto ou nenhum", () => {
    expect(buscar("net")).toBeUndefined();
    expect(buscar(undefined)).toBeUndefined();
  });

  it("recusa texto longo demais ou repetido", () => {
    expect(buscar("a".repeat(61)).statusCode).toBe(400);
    expect(buscar(["a", "b"]).statusCode).toBe(400);
  });
});
