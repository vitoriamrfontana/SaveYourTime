const subscriptionsModel = require("../src/models/subscriptionsModel");

const SEED = [
  { id: 1, nome: "Streaming de Filmes", valorMensal: 39.9, ativo: true },
  { id: 2, nome: "Academia Online", valorMensal: 49.9, ativo: false },
  { id: 3, nome: "Seguro Celular", valorMensal: 24.9, ativo: false },
];

beforeEach(() => {
  subscriptionsModel._resetForTests(SEED);
});

// Sprint 1

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

  it("preenche canceladaEm ao cancelar e limpa ao reativar", () => {
    const cancelada = subscriptionsModel.toggleSubscription(1);
    expect(cancelada.canceladaEm).not.toBeNull();

    const reativada = subscriptionsModel.toggleSubscription(1);
    expect(reativada.canceladaEm).toBeNull();
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

  it("aceita uma categoria válida", () => {
    const nova = subscriptionsModel.addSubscription({ nome: "Netflix", valorMensal: 39.9, categoria: "streaming" });
    expect(nova.categoria).toBe("streaming");
  });

  it("usa 'outros' quando a categoria é inválida ou não informada", () => {
    const semCategoria = subscriptionsModel.addSubscription({ nome: "A", valorMensal: 10 });
    const invalida = subscriptionsModel.addSubscription({ nome: "B", valorMensal: 10, categoria: "xyz" });
    expect(semCategoria.categoria).toBe("outros");
    expect(invalida.categoria).toBe("outros");
  });
});

// Sprint 2

describe("subscriptionsModel.getAuditoria", () => {
  it("começa vazia", () => {
    expect(subscriptionsModel.getAuditoria()).toHaveLength(0);
  });

  it("registra cancelamentos e reativações, do mais recente para o mais antigo", () => {
    subscriptionsModel.toggleSubscription(1); // cancela
    subscriptionsModel.toggleSubscription(1); // reativa

    const auditoria = subscriptionsModel.getAuditoria();
    expect(auditoria).toHaveLength(2);
    expect(auditoria[0].acao).toBe("reativada");
    expect(auditoria[1].acao).toBe("cancelada");
    expect(auditoria[1].assinaturaId).toBe(1);
  });

  it("não registra nada quando o id não existe", () => {
    subscriptionsModel.toggleSubscription(999);
    expect(subscriptionsModel.getAuditoria()).toHaveLength(0);
  });
});

describe("subscriptionsModel.calcularCustoInvisivel", () => {
  it("considera apenas as assinaturas ativas", () => {
    const custo = subscriptionsModel.calcularCustoInvisivel();
    expect(custo.itens).toHaveLength(1);
    expect(custo.itens[0].id).toBe(1);
    expect(custo.gastoMensal).toBeCloseTo(39.9);
  });

  it("projeta o gasto acumulado em 12, 36 e 60 meses", () => {
    const custo = subscriptionsModel.calcularCustoInvisivel();
    const valores = custo.itens[0].projecoes.map((p) => p.valor);
    expect(custo.itens[0].projecoes.map((p) => p.meses)).toEqual([12, 36, 60]);
    expect(valores[0]).toBeCloseTo(478.8);
    expect(valores[1]).toBeCloseTo(1436.4);
    expect(valores[2]).toBeCloseTo(2394);
  });

  it("soma o total de todas as ativas em cada período", () => {
    subscriptionsModel.addSubscription({ nome: "Nova", valorMensal: 10.1 });
    const custo = subscriptionsModel.calcularCustoInvisivel();
    expect(custo.totais[0].valor).toBeCloseTo(50 * 12);
    expect(custo.totais[2].valor).toBeCloseTo(50 * 60);
  });
});

describe("subscriptionsModel.calcularProjecaoJuros", () => {
  it("com taxa zero, o montante é igual ao total aportado", () => {
    const projecao = subscriptionsModel.calcularProjecaoJuros(0);
    projecao.periodos.forEach((p) => {
      expect(p.montante).toBeCloseTo(p.totalAportado);
      expect(p.rendimento).toBeCloseTo(0);
    });
  });

  it("com juros, o montante supera o total aportado", () => {
    const projecao = subscriptionsModel.calcularProjecaoJuros();
    projecao.periodos.forEach((p) => {
      expect(p.montante).toBeGreaterThan(p.totalAportado);
    });
  });

  it("bate com a fórmula de aportes mensais em 12 meses", () => {
    const taxaAnual = 0.12;
    const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;
    // Em 12 meses, (1 + i)^12 - 1 = taxaAnual, então FV = P * taxaAnual / i
    const esperado = (74.8 * taxaAnual) / taxaMensal;

    const projecao = subscriptionsModel.calcularProjecaoJuros(taxaAnual);
    expect(projecao.periodos[0].meses).toBe(12);
    expect(projecao.periodos[0].montante).toBeCloseTo(esperado, 1);
  });

  it("gera a curva de 0 a 60 meses, de 6 em 6", () => {
    const { curva } = subscriptionsModel.calcularProjecaoJuros();
    expect(curva).toHaveLength(11);
    expect(curva[0]).toMatchObject({ meses: 0, montante: 0 });
    expect(curva[curva.length - 1].meses).toBe(60);
  });

  it("retorna tudo zerado quando não há assinaturas canceladas", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "X", valorMensal: 10, ativo: true },
    ]);
    const projecao = subscriptionsModel.calcularProjecaoJuros();
    expect(projecao.economiaMensal).toBe(0);
    projecao.periodos.forEach((p) => expect(p.montante).toBe(0));
  });
});

describe("subscriptionsModel.calcularHorasTrabalho", () => {
  it("converte o gasto das ativas em horas de trabalho", () => {
    const horas = subscriptionsModel.calcularHorasTrabalho({ valorHora: 21.88, horasMensais: 160 });
    expect(horas.gastoMensal).toBeCloseTo(39.9);
    expect(horas.horasNecessarias).toBe(1.82);
    expect(horas.percentualDoMes).toBeCloseTo((39.9 / 21.88 / 160) * 100);
  });

  it("retorna horas nulas quando o valorHora é inválido", () => {
    const horas = subscriptionsModel.calcularHorasTrabalho({ valorHora: 0, horasMensais: 160 });
    expect(horas.horasNecessarias).toBeNull();
    expect(horas.percentualDoMes).toBeNull();
  });

  it("retorna percentual nulo quando horasMensais não é informado", () => {
    const horas = subscriptionsModel.calcularHorasTrabalho({ valorHora: 20 });
    expect(horas.horasNecessarias).toBe(2);
    expect(horas.percentualDoMes).toBeNull();
  });
});

describe("subscriptionsModel.getResumoDetox", () => {
  it("resume quantidades e valores do módulo", () => {
    const resumo = subscriptionsModel.getResumoDetox();
    expect(resumo).toMatchObject({ totalAssinaturas: 3, ativas: 1, canceladas: 2 });
    expect(resumo.gastoMensalAtivo).toBeCloseTo(39.9);
    expect(resumo.economiaMensal).toBeCloseTo(74.8);
  });
});