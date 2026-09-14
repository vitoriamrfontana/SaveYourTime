const subscriptionsModel = require("../src/models/subscriptionsModel");

const SEED = [
  { id: 1, nome: "Streaming de Filmes", valorMensal: 39.9, ativo: true },
  { id: 2, nome: "Academia Online", valorMensal: 49.9, ativo: false },
  { id: 3, nome: "Seguro Celular", valorMensal: 24.9, ativo: false },
];

beforeEach(() => {
  subscriptionsModel._resetForTests(SEED);
});

describe("subscriptionsModel.getSubscriptions", () => {
  it("retorna todas as assinaturas cadastradas", () => {
    const result = subscriptionsModel.getSubscriptions();
    expect(result).toHaveLength(3);
  });

  it("retorna uma cópia, sem permitir mutação do estado interno", () => {
    const result = subscriptionsModel.getSubscriptions();
    result[0].nome = "Alterado";

    const resultDeNovo = subscriptionsModel.getSubscriptions();
    expect(resultDeNovo[0].nome).toBe("Streaming de Filmes");
  });
});

describe("subscriptionsModel.getEconomiaTotal", () => {
  it("soma apenas as assinaturas canceladas (ativo: false)", () => {
    const economia = subscriptionsModel.getEconomiaTotal();
    expect(economia.economiaMensal).toBeCloseTo(74.8);
    expect(economia.economiaAnual).toBeCloseTo(74.8 * 12);
  });

  it("retorna zero quando nenhuma assinatura está cancelada", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "X", valorMensal: 10, ativo: true },
    ]);
    const economia = subscriptionsModel.getEconomiaTotal();
    expect(economia.economiaMensal).toBe(0);
    expect(economia.economiaAnual).toBe(0);
  });
});

describe("subscriptionsModel.toggleSubscription", () => {
  it("inverte o status ativo/cancelado", () => {
    const atualizado = subscriptionsModel.toggleSubscription(1);
    expect(atualizado.ativo).toBe(false);

    const atualizadoDeNovo = subscriptionsModel.toggleSubscription(1);
    expect(atualizadoDeNovo.ativo).toBe(true);
  });

  it("retorna null quando o id não existe", () => {
    const resultado = subscriptionsModel.toggleSubscription(999);
    expect(resultado).toBeNull();
  });
});

describe("subscriptionsModel.addSubscription", () => {
  it("adiciona uma nova assinatura já ativa por padrão", () => {
    const nova = subscriptionsModel.addSubscription({ nome: "Nova", valorMensal: 15 });
    expect(nova.ativo).toBe(true);
    expect(nova.nome).toBe("Nova");
    expect(subscriptionsModel.getSubscriptions()).toHaveLength(4);
  });

  it("gera ids incrementais sem colisão", () => {
    const primeira = subscriptionsModel.addSubscription({ nome: "A", valorMensal: 10 });
    const segunda = subscriptionsModel.addSubscription({ nome: "B", valorMensal: 20 });
    expect(segunda.id).toBe(primeira.id + 1);
  });
});