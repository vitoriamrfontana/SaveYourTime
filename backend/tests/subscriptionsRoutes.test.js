const request = require("supertest");
const subscriptionsModel = require("../src/models/subscriptionsModel");
const taxasService = require("../src/services/taxasService");
const { hoje, adicionarDias } = require("../src/utils/datas");
const criarAppDetox = require("./helpers/criarAppDetox");

// Sprint 4: os testes nunca chamam a internet. Sem o Banco Central, o controller
// usa as taxas de reserva (fonte "fallback").
const fetchOriginal = global.fetch;
beforeAll(() => {
  global.fetch = jest.fn().mockRejectedValue(new Error("Sem internet nos testes"));
});
afterAll(() => {
  global.fetch = fetchOriginal;
});

const app = criarAppDetox();

// A validação de pausa e teste grátis compara com o dia em que o teste roda
const AMANHA = adicionarDias(hoje(), 1);

const SEED = [
  { id: 1, nome: "Filmes A", valorMensal: 39.9, ativo: true, categoria: "streaming", tipo: "video" },
  { id: 2, nome: "Séries B", valorMensal: 34.9, ativo: true, categoria: "streaming", tipo: "video" },
  {
    id: 3,
    nome: "Academia",
    valorMensal: 49.9,
    ativo: false,
    categoria: "saude",
    tipo: "academia",
    canceladaEm: "2026-08-10T15:00:00.000Z",
  },
];

beforeEach(() => {
  subscriptionsModel._resetForTests(SEED);
  taxasService._limparCache();
});

// Formato padrão de erro do errorHandler: { success: false, error: { message } }
function esperarErro(res, status) {
  expect(res.status).toBe(status);
  expect(res.body).toEqual({ success: false, error: { message: expect.any(String) } });
}

describe("GET /api/subscriptions", () => {
  it("lista as assinaturas e a economia no formato { success, data }", async () => {
    const res = await request(app).get("/api/subscriptions");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subscriptions).toHaveLength(3);
    expect(res.body.data.economia).toEqual({
      economiaMensal: 49.9,
      economiaAnual: 598.8,
      economiaAcumulada: expect.any(Number),
    });
    expect(res.body.data.subscriptions[2].economizadoAteHoje).toEqual(expect.any(Number));
  });
});

describe("POST /api/subscriptions", () => {
  it("cadastra e responde 201", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .send({ nome: "Spotify", valorMensal: 21.9, categoria: "streaming", tipo: "musica" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: expect.objectContaining({ id: 4, nome: "Spotify", ativo: true, categoria: "streaming", tipo: "musica" }),
    });
  });

  it("deduz a categoria pelo tipo", async () => {
    const res = await request(app).post("/api/subscriptions").send({ nome: "Netflix", valorMensal: 39.9, tipo: "video" });

    expect(res.status).toBe(201);
    expect(res.body.data.categoria).toBe("streaming");
  });

  it("responde 400 para payload inválido", async () => {
    esperarErro(await request(app).post("/api/subscriptions").send({ nome: "Bool", valorMensal: true }), 400);
  });

  it("responde 400 (e não 500) para JSON malformado", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .set("Content-Type", "application/json")
      .send("{ nome: ");

    esperarErro(res, 400);
    expect(res.body.error.message).toBe("O corpo da requisição não é um JSON válido.");
  });
});

describe("PATCH /api/subscriptions/:id/toggle", () => {
  it("cancela e reativa", async () => {
    const cancelada = await request(app).patch("/api/subscriptions/1/toggle");
    expect(cancelada.status).toBe(200);
    expect(cancelada.body.data).toMatchObject({ id: 1, ativo: false });

    const reativada = await request(app).patch("/api/subscriptions/1/toggle");
    expect(reativada.body.data).toMatchObject({ id: 1, ativo: true, canceladaEm: null });
  });

  it("responde 404 para id inexistente", async () => {
    esperarErro(await request(app).patch("/api/subscriptions/999/toggle"), 404);
  });

  it("responde 400 para id inválido", async () => {
    esperarErro(await request(app).patch("/api/subscriptions/abc/toggle"), 400);
  });
});

describe("GET /api/subscriptions/insights", () => {
  it("reúne horas de trabalho, custo invisível, juros e categorias", async () => {
    const res = await request(app).get("/api/subscriptions/insights");

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data)).toEqual(["horasTrabalho", "custoInvisivel", "projecaoJuros", "categorias"]);
    expect(res.body.data.custoInvisivel.gastoMensal).toBe(74.8);
  });
});

describe("GET /api/subscriptions/auditoria", () => {
  it("devolve o histórico, do mais recente para o mais antigo", async () => {
    await request(app).patch("/api/subscriptions/1/toggle");
    const res = await request(app).get("/api/subscriptions/auditoria");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ assinaturaId: 1, acao: "cancelada" });
  });
});

describe("GET /api/subscriptions/redundancies", () => {
  it("devolve os grupos de concorrentes", async () => {
    const res = await request(app).get("/api/subscriptions/redundancies");

    expect(res.status).toBe(200);
    expect(res.body.data.totalGrupos).toBe(1);
    expect(res.body.data.grupos[0].sugestaoPausa.id).toBe(1);
  });
});

describe("POST /api/subscriptions/:id/usage-check", () => {
  it("calcula o custo por uso", async () => {
    const res = await request(app).post("/api/subscriptions/1/usage-check").send({ frequenciaUso: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 1, frequenciaUso: 3, custoPorUso: 13.3, classificacao: "neutro" });
  });

  it("responde 400 para frequenciaUso inválida", async () => {
    esperarErro(await request(app).post("/api/subscriptions/1/usage-check").send({ frequenciaUso: -1 }), 400);
  });

  it("responde 404 para id inexistente", async () => {
    esperarErro(await request(app).post("/api/subscriptions/999/usage-check").send({ frequenciaUso: 3 }), 404);
  });

  // Sprint 4
  it("responde 400 para assinatura cancelada", async () => {
    const res = await request(app).post("/api/subscriptions/3/usage-check").send({ frequenciaUso: 3 });

    esperarErro(res, 400);
    expect(res.body.error.message).toContain("está cancelada");
  });
});

describe("rota inexistente", () => {
  it("responde 404 no formato padrão", async () => {
    esperarErro(await request(app).get("/api/subscriptions/1/nada"), 404);
  });
});

// Sprint 4

describe("GET /api/subscriptions/overview", () => {
  it("devolve a tela inteira numa chamada", async () => {
    const res = await request(app).get("/api/subscriptions/overview");

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data)).toEqual([
      "subscriptions",
      "economia",
      "insights",
      "auditoria",
      "redundancias",
      "proximasCobrancas",
      "limite",
      "taxas",
    ]);
  });
});

describe("GET /api/subscriptions/meta", () => {
  it("devolve a taxonomia e o checklist", async () => {
    const res = await request(app).get("/api/subscriptions/meta");

    expect(res.status).toBe(200);
    expect(res.body.data.categorias).toHaveLength(5);
    expect(res.body.data.checklist.length).toBeGreaterThan(0);
  });
});

describe("GET /api/subscriptions/upcoming", () => {
  it("usa 7 dias por padrão e aceita ?dias=", async () => {
    expect((await request(app).get("/api/subscriptions/upcoming")).body.data.dias).toBe(7);
    expect((await request(app).get("/api/subscriptions/upcoming?dias=30")).body.data.dias).toBe(30);
  });

  it("responde 400 para dias fora da faixa", async () => {
    esperarErro(await request(app).get("/api/subscriptions/upcoming?dias=0"), 400);
  });
});

describe("PATCH /api/subscriptions/:id", () => {
  it("edita e devolve a assinatura com o resumo recalculado", async () => {
    const res = await request(app).patch("/api/subscriptions/1").send({ valorCobrado: 44.9 });

    expect(res.status).toBe(200);
    expect(res.body.data.assinatura).toMatchObject({ id: 1, valorMensal: 44.9 });
    expect(res.body.data.resumo.auditoria[0].acao).toBe("preco_alterado");
  });

  it("responde 400 sem campos e 404 para id inexistente", async () => {
    esperarErro(await request(app).patch("/api/subscriptions/1").send({}), 400);
    esperarErro(await request(app).patch("/api/subscriptions/999").send({ nome: "X" }), 404);
  });
});

describe("DELETE /api/subscriptions/:id", () => {
  it("remove e o resumo já vem sem ela", async () => {
    const res = await request(app).delete("/api/subscriptions/2");

    expect(res.status).toBe(200);
    expect(res.body.data.assinatura.id).toBe(2);
    expect(res.body.data.resumo.subscriptions.map((s) => s.id)).toEqual([1, 3]);
  });

  it("responde 404 para id inexistente", async () => {
    esperarErro(await request(app).delete("/api/subscriptions/999"), 404);
  });
});

describe("PATCH /api/subscriptions/:id/status", () => {
  it("cancela e a economia do resumo já muda", async () => {
    const res = await request(app).patch("/api/subscriptions/1/status").send({ status: "cancelada" });

    expect(res.status).toBe(200);
    expect(res.body.data.assinatura.status).toBe("cancelada");
    expect(res.body.data.resumo.economia.economiaMensal).toBe(89.8); // 49,90 + 39,90
  });

  it("pausa até uma data futura", async () => {
    const res = await request(app)
      .patch("/api/subscriptions/1/status")
      .send({ status: "pausada", pausadaAte: AMANHA });

    expect(res.body.data.assinatura).toMatchObject({ status: "pausada", pausadaAte: AMANHA });
  });

  it("responde 400 para status repetido ou inválido e 404 para id inexistente", async () => {
    esperarErro(await request(app).patch("/api/subscriptions/1/status").send({ status: "ativa" }), 400);
    esperarErro(await request(app).patch("/api/subscriptions/1/status").send({ status: "suspensa" }), 400);
    esperarErro(await request(app).patch("/api/subscriptions/999/status").send({ status: "cancelada" }), 404);
  });
});

describe("POST /api/subscriptions (formato novo)", () => {
  it("cadastra plano anual dividido e responde 201", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .send({ nome: "Antivírus", valorCobrado: 119.9, ciclo: "anual", proximaCobranca: AMANHA, compartilhadaCom: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      ciclo: "anual",
      valorCobrado: 119.9,
      valorMensal: 5,
      proximaCobranca: AMANHA,
    });
  });

  it("responde 400 quando o equivalente mensal passa do teto", async () => {
    esperarErro(
      await request(app).post("/api/subscriptions").send({ nome: "X", valorCobrado: 2400, ciclo: "semanal" }),
      400
    );
  });
});

describe("GET /api/subscriptions/catalog", () => {
  it("busca no catálogo", async () => {
    const res = await request(app).get("/api/subscriptions/catalog?q=spot");

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ id: "spotify", tipo: "musica" });
  });

  it("responde 400 para busca longa demais", async () => {
    esperarErro(await request(app).get(`/api/subscriptions/catalog?q=${"a".repeat(61)}`), 400);
  });
});

describe("GET /api/subscriptions/review", () => {
  it("traz um cartão por assinatura ativa, com o valor-hora do Perfil", async () => {
    const res = await request(app).get("/api/subscriptions/review");

    expect(res.status).toBe(200);
    expect(res.body.data.itens).toHaveLength(2); // a Academia está cancelada
    expect(res.body.data.valorHora).toBe(21.88);
  });
});

describe("GET e PATCH /api/subscriptions/settings", () => {
  it("lê e muda a meta de gasto, e o resumo já vem com a meta nova", async () => {
    expect((await request(app).get("/api/subscriptions/settings")).body.data).toEqual({ limitePercentualRenda: 5 });

    const res = await request(app).patch("/api/subscriptions/settings").send({ limitePercentualRenda: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data.configuracoes).toEqual({ limitePercentualRenda: 3 });
    expect(res.body.data.resumo.limite.limitePercentual).toBe(3);
  });

  it("responde 400 para meta inválida", async () => {
    esperarErro(await request(app).patch("/api/subscriptions/settings").send({ limitePercentualRenda: 0 }), 400);
  });
});

describe("GET /api/subscriptions/:id/cancel-guide", () => {
  it("devolve o passo a passo e os direitos", async () => {
    const res = await request(app).get("/api/subscriptions/1/cancel-guide");

    expect(res.status).toBe(200);
    expect(res.body.data.passos.length).toBeGreaterThan(0);
    expect(res.body.data.direitos.length).toBeGreaterThan(0);
  });

  it("responde 404 para id inexistente", async () => {
    esperarErro(await request(app).get("/api/subscriptions/999/cancel-guide"), 404);
  });
});

describe("POST /api/subscriptions/:id/usage-check (forma do tipo)", () => {
  it("responde 400 quando o tipo pede outra forma de verificação", async () => {
    // Filmes A é vídeo: precisa de frequenciaUso, e não de resposta
    esperarErro(await request(app).post("/api/subscriptions/1/usage-check").send({ resposta: true }), 400);
  });
});

describe("taxas sem o Banco Central", () => {
  it("o resumo usa as taxas de reserva e diz isso", async () => {
    const res = await request(app).get("/api/subscriptions/overview");

    expect(res.body.data.taxas).toMatchObject({ fonte: "fallback", atualizadoEm: "2026-10-29" });
    expect(res.body.data.insights.projecaoJuros.fonteTaxa).toBe("fallback");
  });
});
