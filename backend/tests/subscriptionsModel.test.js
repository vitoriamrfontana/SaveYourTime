const subscriptionsModel = require("../src/models/subscriptionsModel");

// Sprint 4: as inativas têm canceladaEm (foram canceladas pelo usuário);
// sem a data, elas não contariam mais como economia
const SEED = [
  { id: 1, nome: "Streaming de Filmes", valorMensal: 39.9, ativo: true },
  { id: 2, nome: "Academia Online", valorMensal: 49.9, ativo: false, canceladaEm: "2026-08-10T15:00:00.000Z" },
  { id: 3, nome: "Seguro Celular", valorMensal: 24.9, ativo: false, canceladaEm: "2026-09-05T15:00:00.000Z" },
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
  it("soma apenas as assinaturas canceladas pelo usuário", () => {
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

// Sprint 4: os testes que faltavam para as funções da Sprint 3 (concorrentes, custo
// por uso e tipo) e os das regras novas desta sprint (economia real e acumulada)

const SEED_CONCORRENTES = [
  { id: 1, nome: "Filmes A", valorMensal: 39.9, ativo: true, categoria: "streaming", tipo: "video" },
  { id: 2, nome: "Séries B", valorMensal: 34.9, ativo: true, categoria: "streaming", tipo: "video" },
  { id: 3, nome: "Música C", valorMensal: 21.9, ativo: true, categoria: "streaming", tipo: "musica" },
  { id: 4, nome: "Tarifa D", valorMensal: 19.9, ativo: true, categoria: "financeiro", tipo: "conta_bancaria" },
];

describe("subscriptionsModel.detectarRedundancias", () => {
  beforeEach(() => {
    subscriptionsModel._resetForTests(SEED_CONCORRENTES);
  });

  it("agrupa só as assinaturas ativas do mesmo tipo", () => {
    const resultado = subscriptionsModel.detectarRedundancias();

    expect(resultado.totalGrupos).toBe(1);
    expect(resultado.grupos[0]).toMatchObject({ tipo: "video", categoria: "streaming", quantidade: 2 });
    expect(resultado.grupos[0].gastoMensal).toBe(74.8);
  });

  it("sem verificação de uso, sugere pausar a mais cara", () => {
    const { sugestaoPausa } = subscriptionsModel.detectarRedundancias().grupos[0];

    expect(sugestaoPausa).toMatchObject({ id: 1, economiaMensal: 39.9, economiaAnual: 478.8 });
    expect(sugestaoPausa.motivo).toBe("É a mais cara entre serviços que fazem a mesma coisa.");
  });

  it("quem não foi usado nenhuma vez vem antes da mais cara", () => {
    subscriptionsModel.calcularCustoUso(2, 0);
    const { sugestaoPausa } = subscriptionsModel.detectarRedundancias().grupos[0];

    expect(sugestaoPausa.id).toBe(2);
    expect(sugestaoPausa.motivo).toBe("Você não usou nenhuma vez no último mês.");
  });

  it("mostra o custo por uso no motivo quando ele é alto", () => {
    subscriptionsModel.calcularCustoUso(2, 1); // R$ 34,90 por uso: prejuízo
    const { sugestaoPausa } = subscriptionsModel.detectarRedundancias().grupos[0];

    expect(sugestaoPausa.id).toBe(2);
    expect(sugestaoPausa.motivo).toContain("R$ 34,90");
  });

  it("uma verificação excelente tira a mais cara da sugestão", () => {
    subscriptionsModel.calcularCustoUso(1, 20);
    expect(subscriptionsModel.detectarRedundancias().grupos[0].sugestaoPausa.id).toBe(2);
  });

  it("grupo com 3 concorrentes sugere pausar só uma", () => {
    subscriptionsModel.addSubscription({ nome: "Filmes E", valorMensal: 29.9, categoria: "streaming", tipo: "video" });
    const resultado = subscriptionsModel.detectarRedundancias();

    expect(resultado.grupos[0].quantidade).toBe(3);
    expect(resultado.grupos[0].gastoMensal).toBe(104.7);
    expect(resultado.economiaPotencialMensal).toBe(39.9);
  });

  it("empate de custo-benefício: sugere a mais cara", () => {
    subscriptionsModel.calcularCustoUso(1, 4); // neutro
    subscriptionsModel.calcularCustoUso(2, 3); // neutro
    expect(subscriptionsModel.detectarRedundancias().grupos[0].sugestaoPausa.id).toBe(1);
  });

  it("empate também no valor: sugere a cadastrada primeiro", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "A", valorMensal: 20, ativo: true, categoria: "streaming", tipo: "musica" },
      { id: 2, nome: "B", valorMensal: 20, ativo: true, categoria: "streaming", tipo: "musica" },
    ]);
    expect(subscriptionsModel.detectarRedundancias().grupos[0].sugestaoPausa.id).toBe(1);
  });

  it("assinatura cancelada não entra no grupo", () => {
    subscriptionsModel.toggleSubscription(1);
    expect(subscriptionsModel.detectarRedundancias().totalGrupos).toBe(0);
  });

  it("a categoria 'outros' não tem tipos e nunca gera alerta", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "Clube do Livro", valorMensal: 30, ativo: true, categoria: "outros", tipo: "video" },
      { id: 2, nome: "Clube do Vinho", valorMensal: 90, ativo: true, categoria: "outros", tipo: "video" },
    ]);

    expect(subscriptionsModel.getSubscriptions()[0].tipo).toBeNull();
    expect(subscriptionsModel.detectarRedundancias().totalGrupos).toBe(0);
  });

  it("soma uma sugestão por grupo e ordena os grupos pelo gasto", () => {
    subscriptionsModel.addSubscription({ nome: "Música F", valorMensal: 16.9, categoria: "streaming", tipo: "musica" });
    const resultado = subscriptionsModel.detectarRedundancias();

    expect(resultado.grupos.map((g) => g.tipo)).toEqual(["video", "musica"]);
    expect(resultado.economiaPotencialMensal).toBe(61.8); // 39,90 + 21,90
    expect(resultado.economiaPotencialAnual).toBe(741.6);
  });

  it("devolve cópias das assinaturas do grupo", () => {
    subscriptionsModel.detectarRedundancias().grupos[0].assinaturas[0].nome = "Alterado";
    expect(subscriptionsModel.getSubscriptions()[0].nome).toBe("Filmes A");
  });
});

describe("subscriptionsModel.calcularCustoUso", () => {
  const AGORA = new Date("2026-11-01T15:00:00.000Z");

  beforeEach(() => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "Academia", valorMensal: 90, ativo: true, categoria: "saude", tipo: "academia" },
      { id: 2, nome: "Cancelada", valorMensal: 30, ativo: false, canceladaEm: "2026-10-01T15:00:00.000Z" },
    ]);
  });

  it("divide a mensalidade pelos usos do mês", () => {
    expect(subscriptionsModel.calcularCustoUso(1, 3, { agora: AGORA })).toEqual({
      id: 1,
      nome: "Academia",
      valorMensal: 90,
      frequenciaUso: 3,
      custoPorUso: 30,
      classificacao: "prejuizo",
      verificadoEm: AGORA.toISOString(),
    });
  });

  it.each([
    [18, 5, "excelente"], // exatamente no limite de R$ 5
    [9, 10, "neutro"],
    [6, 15, "neutro"], // exatamente no limite de R$ 15
    [5, 18, "prejuizo"],
  ])("%i usos de R$ 90 = R$ %d por uso: %s", (usos, custo, classificacao) => {
    const resultado = subscriptionsModel.calcularCustoUso(1, usos);
    expect(resultado.custoPorUso).toBe(custo);
    expect(resultado.classificacao).toBe(classificacao);
  });

  it("1 uso: o custo por uso é a mensalidade inteira", () => {
    expect(subscriptionsModel.calcularCustoUso(1, 1).custoPorUso).toBe(90);
  });

  it("0 usos: sem custo por uso e classificado como prejuízo", () => {
    const resultado = subscriptionsModel.calcularCustoUso(1, 0);
    expect(resultado.custoPorUso).toBeNull();
    expect(resultado.classificacao).toBe("prejuizo");
  });

  it("1000 usos: centavos por uso e excelente", () => {
    const resultado = subscriptionsModel.calcularCustoUso(1, 1000);
    expect(resultado.custoPorUso).toBe(0.09);
    expect(resultado.classificacao).toBe("excelente");
  });

  it("grava a verificação na assinatura sem vazar referência", () => {
    subscriptionsModel.calcularCustoUso(1, 3, { agora: AGORA });
    subscriptionsModel.getSubscriptions()[0].usoMensal.custoPorUso = 0;

    expect(subscriptionsModel.getSubscriptions()[0].usoMensal).toMatchObject({
      frequenciaUso: 3,
      custoPorUso: 30,
      verificadoEm: AGORA.toISOString(),
    });
  });

  it("retorna null quando o id não existe", () => {
    expect(subscriptionsModel.calcularCustoUso(999, 3)).toBeNull();
  });

  it("recusa assinatura cancelada e não grava nada", () => {
    expect(subscriptionsModel.calcularCustoUso(2, 3)).toEqual({
      erro: "A assinatura 'Cancelada' está cancelada. Reative-a para verificar o uso.",
    });
    expect(subscriptionsModel.getSubscriptions()[1].usoMensal).toBeNull();
  });
});

describe("subscriptionsModel.addSubscription (tipo)", () => {
  it("mantém o tipo que pertence à categoria", () => {
    const nova = subscriptionsModel.addSubscription({ nome: "Spotify", valorMensal: 21.9, categoria: "streaming", tipo: "musica" });
    expect(nova.tipo).toBe("musica");
  });

  it("descarta o tipo que é de outra categoria", () => {
    const nova = subscriptionsModel.addSubscription({ nome: "X", valorMensal: 10, categoria: "saude", tipo: "video" });
    expect(nova.tipo).toBeNull();
  });

  it("sem categoria, deduz a categoria pelo tipo", () => {
    const nova = subscriptionsModel.addSubscription({ nome: "Netflix", valorMensal: 39.9, tipo: "video" });
    expect(nova).toMatchObject({ categoria: "streaming", tipo: "video" });
  });

  it("sem categoria e com tipo inexistente, fica em 'outros' sem tipo", () => {
    const nova = subscriptionsModel.addSubscription({ nome: "X", valorMensal: 10, tipo: "xyz" });
    expect(nova).toMatchObject({ categoria: "outros", tipo: null });
  });
});

describe("subscriptionsModel: economia real", () => {
  const AGORA = new Date("2026-11-01T15:00:00.000Z");

  it("não conta inativa sem canceladaEm (o usuário nunca a cancelou)", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "Nunca cancelada", valorMensal: 50, ativo: false },
      { id: 2, nome: "Cancelada", valorMensal: 10, ativo: false, canceladaEm: "2026-10-20T15:00:00.000Z" },
    ]);

    expect(subscriptionsModel.getEconomiaTotal({ agora: AGORA })).toMatchObject({
      economiaMensal: 10,
      economiaAnual: 120,
    });
  });

  it("o seed da demo traz as inativas com data de cancelamento e evento no histórico", () => {
    subscriptionsModel._resetForTests(undefined, { agora: AGORA });

    // Academia (R$ 49,90) cancelada há 75 dias: 2 cobranças puladas.
    // Nuvem (R$ 9,90), há 130 dias: 4 cobranças puladas.
    expect(subscriptionsModel.getEconomiaTotal({ agora: AGORA })).toEqual({
      economiaMensal: 59.8,
      economiaAnual: 717.6,
      economiaAcumulada: 139.4,
    });
    expect(subscriptionsModel.getAuditoria().map((e) => [e.nome, e.acao])).toEqual([
      ["Academia Online", "cancelada"],
      ["Aplicativo de Nuvem (Storage)", "cancelada"],
    ]);
  });
});

describe("subscriptionsModel: economia acumulada", () => {
  // Meio-dia em Brasília do dia informado
  const em = (data) => ({ agora: new Date(`${data}T15:00:00.000Z`) });
  const acumuladaEm = (data) => subscriptionsModel.getEconomiaTotal(em(data)).economiaAcumulada;

  beforeEach(() => {
    subscriptionsModel._resetForTests([{ id: 1, nome: "Netflix", valorMensal: 39.9, ativo: true }]);
  });

  it("conta as cobranças que deixaram de acontecer desde o cancelamento", () => {
    subscriptionsModel.toggleSubscription(1, em("2026-01-15"));
    expect(acumuladaEm("2026-04-20")).toBe(119.7); // 15/02, 15/03 e 15/04
  });

  it("a cobrança de hoje já conta; a de amanhã ainda não", () => {
    subscriptionsModel.toggleSubscription(1, em("2026-01-15"));
    expect(acumuladaEm("2026-02-14")).toBe(0);
    expect(acumuladaEm("2026-02-15")).toBe(39.9);
  });

  it("cancelar, reativar e cancelar de novo não conta em dobro", () => {
    subscriptionsModel.toggleSubscription(1, em("2026-01-15")); // cancela
    subscriptionsModel.toggleSubscription(1, em("2026-03-15")); // reativa: a cobrança de 15/03 volta
    subscriptionsModel.toggleSubscription(1, em("2026-03-15")); // cancela de novo no mesmo dia

    // 15/02 no primeiro período; 15/04 e 15/05 no segundo
    expect(acumuladaEm("2026-05-20")).toBe(119.7);
  });

  it("reativada continua no acumulado, mas sai da economia mensal", () => {
    subscriptionsModel.toggleSubscription(1, em("2026-01-15"));
    subscriptionsModel.toggleSubscription(1, em("2026-04-01"));

    expect(subscriptionsModel.getEconomiaTotal(em("2026-06-01"))).toEqual({
      economiaMensal: 0,
      economiaAnual: 0,
      economiaAcumulada: 79.8, // 15/02 e 15/03
    });
  });

  it("reativar antes da próxima cobrança não gera economia", () => {
    subscriptionsModel.toggleSubscription(1, em("2026-01-15"));
    subscriptionsModel.toggleSubscription(1, em("2026-02-10"));
    expect(acumuladaEm("2026-06-01")).toBe(0);
  });

  it("usa o dia do cancelamento no horário de Brasília", () => {
    // 02h UTC de 31/01 ainda é dia 30 em Brasília: as cobranças cairiam no dia 30
    subscriptionsModel.toggleSubscription(1, { agora: new Date("2026-01-31T02:00:00.000Z") });
    expect(acumuladaEm("2026-03-30")).toBe(79.8); // 28/02 e 30/03
  });

  it("dia 31 em fevereiro, em abril e na virada do ano", () => {
    subscriptionsModel.toggleSubscription(1, em("2026-12-31"));
    expect(acumuladaEm("2027-02-28")).toBe(79.8); // 31/01 e 28/02 (2027 não é bissexto)
    expect(acumuladaEm("2027-04-30")).toBe(159.6); // + 31/03 e 30/04
  });

  it("dia 31 em fevereiro de ano bissexto cai no dia 29", () => {
    subscriptionsModel.toggleSubscription(1, em("2028-01-31"));
    expect(acumuladaEm("2028-02-28")).toBe(0);
    expect(acumuladaEm("2028-02-29")).toBe(39.9);
  });

  it("cada assinatura informa quanto já economizou", () => {
    subscriptionsModel.addSubscription({ nome: "Spotify", valorMensal: 21.9 });
    subscriptionsModel.toggleSubscription(1, em("2026-01-15"));

    const lista = subscriptionsModel.getSubscriptions(em("2026-03-20"));
    expect(lista.map((s) => s.economizadoAteHoje)).toEqual([79.8, 0]);
  });

  it("não expõe os períodos internos na API", () => {
    const cancelada = subscriptionsModel.toggleSubscription(1, em("2026-01-15"));

    expect(cancelada).not.toHaveProperty("periodosSemCobranca");
    expect(subscriptionsModel.getSubscriptions()[0]).not.toHaveProperty("periodosSemCobranca");
  });

  it("o resumo para outros módulos também traz a economia acumulada", () => {
    subscriptionsModel.toggleSubscription(1, em("2026-01-15"));
    expect(subscriptionsModel.getResumoDetox(em("2026-02-15")).economiaAcumulada).toBe(39.9);
  });
});

// Sprint 4: ciclos, plano dividido, calendário de cobranças, status, edição e exclusão

// Meio-dia em Brasília do dia informado
const em = (data) => ({ agora: new Date(`${data}T15:00:00.000Z`) });

describe("subscriptionsModel: ciclo e plano dividido", () => {
  beforeEach(() => {
    subscriptionsModel._resetForTests([]);
  });

  it.each([
    ["semanal", 10, 43.33],
    ["mensal", 39.9, 39.9],
    ["trimestral", 90, 30],
    ["semestral", 60, 10],
    ["anual", 119.9, 9.99],
  ])("ciclo %s: cobrança de R$ %s equivale a R$ %s por mês", (ciclo, valorCobrado, valorMensal) => {
    const nova = subscriptionsModel.addSubscription({ nome: "X", valorCobrado, ciclo }, em("2026-11-01"));
    expect(nova).toMatchObject({ ciclo, valorCobrado, valorMensal });
  });

  it("plano dividido: os cálculos usam a sua parte", () => {
    subscriptionsModel.addSubscription({ nome: "Família", valorCobrado: 60, compartilhadaCom: 2 }, em("2026-11-01"));

    expect(subscriptionsModel.getSubscriptions(em("2026-11-01"))[0]).toMatchObject({
      valorCobrado: 60,
      compartilhadaCom: 2,
      valorMensal: 20,
    });
    expect(subscriptionsModel.calcularCustoInvisivel(em("2026-11-01")).gastoMensal).toBe(20);
  });

  it("dado antigo, só com valorMensal, continua mensal e sem divisão", () => {
    subscriptionsModel._resetForTests([{ id: 1, nome: "Antiga", valorMensal: 39.9, ativo: true }]);

    expect(subscriptionsModel.getSubscriptions(em("2026-11-01"))[0]).toMatchObject({
      status: "ativa",
      ciclo: "mensal",
      valorCobrado: 39.9,
      valorMensal: 39.9,
      compartilhadaCom: 0,
      proximaCobranca: null,
    });
  });

  it("recusa valor que equivale a mais de R$ 10.000 por mês", () => {
    const resultado = subscriptionsModel.addSubscription({ nome: "X", valorCobrado: 2400, ciclo: "semanal" });

    expect(resultado.erro).toContain("R$ 10.000");
    expect(subscriptionsModel.getSubscriptions()).toHaveLength(0);
  });

  it("começa o histórico de preços com o valor do cadastro", () => {
    const nova = subscriptionsModel.addSubscription({ nome: "X", valorCobrado: 50, ciclo: "anual" }, em("2026-11-01"));
    expect(nova.historicoPrecos).toEqual([{ valor: 50, ciclo: "anual", desde: "2026-11-01" }]);
  });
});

describe("subscriptionsModel: próxima cobrança", () => {
  const proximaEm = (data) => subscriptionsModel.getSubscriptions(em(data))[0].proximaCobranca;

  beforeEach(() => {
    subscriptionsModel._resetForTests([]);
  });

  it("mensal no dia 31: virada do ano, fevereiro (comum e bissexto) e abril", () => {
    subscriptionsModel.addSubscription({ nome: "X", valorMensal: 10, diaCobranca: 31 }, em("2026-12-10"));

    expect(proximaEm("2026-12-10")).toBe("2026-12-31");
    expect(proximaEm("2027-01-01")).toBe("2027-01-31");
    expect(proximaEm("2027-02-01")).toBe("2027-02-28");
    expect(proximaEm("2027-04-01")).toBe("2027-04-30");
    expect(proximaEm("2028-02-01")).toBe("2028-02-29");
  });

  it("a cobrança de hoje ainda é a próxima", () => {
    subscriptionsModel.addSubscription({ nome: "X", valorMensal: 10, diaCobranca: 15 }, em("2026-11-01"));

    expect(proximaEm("2026-11-15")).toBe("2026-11-15");
    expect(proximaEm("2026-11-16")).toBe("2026-12-15");
  });

  it("anual: cobra no mês certo e depois só no ano seguinte", () => {
    subscriptionsModel.addSubscription(
      { nome: "Anual", valorCobrado: 120, ciclo: "anual", proximaCobranca: "2026-11-20" },
      em("2026-11-01")
    );

    expect(proximaEm("2026-11-01")).toBe("2026-11-20"); // no mês atual
    expect(proximaEm("2026-11-21")).toBe("2027-11-20"); // fora dele
  });

  it("semanal: de 7 em 7 dias, sem dia do mês", () => {
    subscriptionsModel.addSubscription(
      { nome: "Revista", valorCobrado: 10, ciclo: "semanal", proximaCobranca: "2026-11-03" },
      em("2026-11-01")
    );

    expect(proximaEm("2026-11-04")).toBe("2026-11-10");
    expect(subscriptionsModel.getSubscriptions()[0].diaCobranca).toBeNull();
  });

  it("sem dia nem data de cobrança, não há próxima cobrança", () => {
    subscriptionsModel.addSubscription({ nome: "X", valorMensal: 10 }, em("2026-11-01"));
    expect(proximaEm("2026-11-01")).toBeNull();
  });
});

describe("subscriptionsModel.alterarStatus", () => {
  const assinaturaEm = (data) => subscriptionsModel.getSubscriptions(em(data))[0];

  beforeEach(() => {
    // Cobrada todo dia 15
    subscriptionsModel._resetForTests([
      {
        id: 1,
        nome: "Netflix",
        valorMensal: 39.9,
        ativo: true,
        categoria: "streaming",
        tipo: "video",
        dataBaseCobranca: "2026-01-15",
        diaCobranca: 15,
      },
    ]);
  });

  it("pausar tira dos gastos sem virar economia recorrente", () => {
    const pausada = subscriptionsModel.alterarStatus(1, { status: "pausada", pausadaAte: "2026-03-10" }, em("2026-01-10"));

    expect(pausada).toMatchObject({
      status: "pausada",
      ativo: false,
      pausadaAte: "2026-03-10",
      proximaCobranca: "2026-03-15",
    });
    expect(subscriptionsModel.calcularCustoInvisivel(em("2026-01-10")).gastoMensal).toBe(0);
    expect(subscriptionsModel.getEconomiaTotal(em("2026-01-10")).economiaMensal).toBe(0);
  });

  it("a pausa volta sozinha na data, e as cobranças puladas viram economia acumulada", () => {
    subscriptionsModel.alterarStatus(1, { status: "pausada", pausadaAte: "2026-03-10" }, em("2026-01-10"));

    expect(assinaturaEm("2026-03-09").status).toBe("pausada");
    expect(assinaturaEm("2026-03-10").status).toBe("ativa");
    // 15/01 e 15/02 não foram cobradas; a de 15/03 já é depois da volta
    expect(subscriptionsModel.getEconomiaTotal(em("2026-04-01")).economiaAcumulada).toBe(79.8);
    expect(subscriptionsModel.getAuditoria(em("2026-04-01"))[0]).toMatchObject({
      acao: "retomada",
      data: "2026-03-10T03:00:00.000Z",
    });
  });

  it("pausa com a data de volta no passado já aparece como ativa", () => {
    subscriptionsModel.alterarStatus(1, { status: "pausada", pausadaAte: "2026-02-01" }, em("2026-01-10"));
    expect(assinaturaEm("2026-05-01")).toMatchObject({ status: "ativa", ativo: true, pausadaAte: null });
  });

  it("teste grátis que termina hoje vira ativa, com a primeira cobrança hoje", () => {
    subscriptionsModel._resetForTests([]);
    subscriptionsModel.addSubscription(
      { nome: "Idiomas", valorCobrado: 34.9, status: "teste", fimTeste: "2026-11-05" },
      em("2026-11-01")
    );

    expect(assinaturaEm("2026-11-04")).toMatchObject({ status: "teste", proximaCobranca: "2026-11-05" });
    expect(subscriptionsModel.calcularCustoInvisivel(em("2026-11-04")).gastoMensal).toBe(0);
    expect(assinaturaEm("2026-11-05")).toMatchObject({ status: "ativa", fimTeste: null, proximaCobranca: "2026-11-05" });
    expect(subscriptionsModel.getAuditoria(em("2026-11-05"))[0].acao).toBe("teste_encerrado");
  });

  it("cancelar o teste antes do fim evita a primeira cobrança", () => {
    subscriptionsModel._resetForTests([]);
    subscriptionsModel.addSubscription(
      { nome: "Idiomas", valorCobrado: 34.9, status: "teste", fimTeste: "2026-11-05" },
      em("2026-11-01")
    );
    subscriptionsModel.alterarStatus(1, { status: "cancelada" }, em("2026-11-02"));

    expect(subscriptionsModel.getEconomiaTotal(em("2026-11-06"))).toEqual({
      economiaMensal: 34.9,
      economiaAnual: 418.8,
      economiaAcumulada: 34.9,
    });
  });

  it("repetir o status devolve erro, mas trocar a data da pausa vale (sem contar em dobro)", () => {
    expect(subscriptionsModel.alterarStatus(1, { status: "ativa" }, em("2026-01-10"))).toEqual({
      erro: "A assinatura 'Netflix' já está ativa.",
    });

    subscriptionsModel.alterarStatus(1, { status: "pausada", pausadaAte: "2026-02-01" }, em("2026-01-10"));
    const estendida = subscriptionsModel.alterarStatus(1, { status: "pausada", pausadaAte: "2026-03-01" }, em("2026-01-11"));

    expect(estendida.pausadaAte).toBe("2026-03-01");
    expect(subscriptionsModel.getEconomiaTotal(em("2026-04-01")).economiaAcumulada).toBe(79.8); // 15/01 e 15/02
  });

  it("retorna null quando o id não existe", () => {
    expect(subscriptionsModel.alterarStatus(999, { status: "cancelada" })).toBeNull();
  });

  it("o toggle antigo reativa uma pausada", () => {
    subscriptionsModel.alterarStatus(1, { status: "pausada", pausadaAte: "2026-03-01" }, em("2026-01-10"));

    expect(subscriptionsModel.toggleSubscription(1, em("2026-01-20"))).toMatchObject({ status: "ativa", ativo: true });
    expect(subscriptionsModel.getAuditoria(em("2026-01-20"))[0].acao).toBe("retomada");
  });

  it("registra na auditoria a ação certa de cada mudança", () => {
    subscriptionsModel.alterarStatus(1, { status: "pausada", pausadaAte: "2026-03-01" }, em("2026-01-10"));
    subscriptionsModel.alterarStatus(1, { status: "cancelada" }, em("2026-01-11"));
    subscriptionsModel.alterarStatus(1, { status: "ativa" }, em("2026-01-12"));

    const auditoria = subscriptionsModel.getAuditoria(em("2026-01-12"));
    expect(auditoria.map((e) => e.acao)).toEqual(["reativada", "cancelada", "pausada"]);
    expect(auditoria[2].pausadaAte).toBe("2026-03-01");
  });

  it("pausada sai do detector de concorrentes; teste grátis entra", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "Filmes", valorMensal: 39.9, ativo: true, categoria: "streaming", tipo: "video" },
      { id: 2, nome: "Séries", valorMensal: 34.9, ativo: true, categoria: "streaming", tipo: "video" },
    ]);

    subscriptionsModel.alterarStatus(2, { status: "pausada", pausadaAte: "2026-03-01" }, em("2026-01-10"));
    expect(subscriptionsModel.detectarRedundancias(em("2026-01-10")).totalGrupos).toBe(0);

    subscriptionsModel.alterarStatus(2, { status: "teste", fimTeste: "2026-02-01" }, em("2026-01-11"));
    expect(subscriptionsModel.detectarRedundancias(em("2026-01-11")).grupos[0].quantidade).toBe(2);
  });

  it("quando a sugestão é um teste grátis, o motivo fala em cancelar antes de cobrar", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "Filmes", valorMensal: 29.9, ativo: true, categoria: "streaming", tipo: "video" },
    ]);
    subscriptionsModel.addSubscription(
      { nome: "Séries", valorCobrado: 44.9, tipo: "video", status: "teste", fimTeste: "2026-02-08" },
      em("2026-02-01")
    );

    const { sugestaoPausa } = subscriptionsModel.detectarRedundancias(em("2026-02-01")).grupos[0];
    expect(sugestaoPausa).toMatchObject({ id: 2, status: "teste" });
    expect(sugestaoPausa.motivo).toBe(
      "Ainda está no teste grátis: cancelando antes de 08/02, a primeira cobrança não acontece."
    );
  });

  it("custo por uso: teste grátis pode, pausada não", () => {
    subscriptionsModel.addSubscription(
      { nome: "Teste", valorCobrado: 30, status: "teste", fimTeste: "2026-02-01" },
      em("2026-01-10")
    );
    subscriptionsModel.alterarStatus(1, { status: "pausada", pausadaAte: "2026-03-01" }, em("2026-01-10"));

    expect(subscriptionsModel.calcularCustoUso(2, 3, em("2026-01-10")).custoPorUso).toBe(10);
    expect(subscriptionsModel.calcularCustoUso(1, 3, em("2026-01-10")).erro).toBe(
      "A assinatura 'Netflix' está pausada. Retome-a para verificar o uso."
    );
  });
});

describe("subscriptionsModel.updateSubscription", () => {
  beforeEach(() => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "Netflix", valorMensal: 39.9, ativo: true, categoria: "streaming", tipo: "video" },
    ]);
  });

  it("edita nome, categoria e tipo", () => {
    const editada = subscriptionsModel.updateSubscription(
      1,
      { nome: "  Spotify ", categoria: "streaming", tipo: "musica" },
      em("2026-11-01")
    );
    expect(editada).toMatchObject({ nome: "Spotify", categoria: "streaming", tipo: "musica" });
  });

  it("trocar só a categoria descarta o tipo que não serve mais", () => {
    expect(subscriptionsModel.updateSubscription(1, { categoria: "saude" }, em("2026-11-01"))).toMatchObject({
      categoria: "saude",
      tipo: null,
    });
  });

  it("mudança de valor entra no histórico de preços e na auditoria", () => {
    const editada = subscriptionsModel.updateSubscription(1, { valorCobrado: 44.9 }, em("2026-11-01"));

    expect(editada.valorMensal).toBe(44.9);
    expect(editada.historicoPrecos).toEqual([
      { valor: 39.9, ciclo: "mensal", desde: null },
      { valor: 44.9, ciclo: "mensal", desde: "2026-11-01" },
    ]);
    expect(subscriptionsModel.getAuditoria(em("2026-11-01"))[0]).toMatchObject({
      acao: "preco_alterado",
      valorAnterior: 39.9,
      valorMensal: 44.9,
    });
  });

  it("mudar a divisão muda a sua parte sem mexer no histórico de preços", () => {
    const editada = subscriptionsModel.updateSubscription(1, { compartilhadaCom: 1 }, em("2026-11-01"));

    expect(editada.valorMensal).toBe(19.95);
    expect(editada.historicoPrecos).toHaveLength(1);
    expect(subscriptionsModel.getAuditoria(em("2026-11-01"))).toHaveLength(0);
  });

  it("cadastra o dia de cobrança depois", () => {
    expect(subscriptionsModel.updateSubscription(1, { diaCobranca: 20 }, em("2026-11-01"))).toMatchObject({
      diaCobranca: 20,
      proximaCobranca: "2026-11-20",
    });
  });

  it("recusa dia de cobrança sem data num ciclo que não é mensal", () => {
    const resultado = subscriptionsModel.updateSubscription(
      1,
      { ciclo: "anual", valorCobrado: 400, diaCobranca: 10 },
      em("2026-11-01")
    );
    expect(resultado.erro).toContain("proximaCobranca");
  });

  it("recusa valor acima do teto sem alterar nada", () => {
    expect(subscriptionsModel.updateSubscription(1, { valorCobrado: 10000.01 }).erro).toContain("R$ 10.000");
    expect(subscriptionsModel.getSubscriptions()[0].valorCobrado).toBe(39.9);
  });

  it("retorna null quando o id não existe", () => {
    expect(subscriptionsModel.updateSubscription(999, { nome: "X" })).toBeNull();
  });
});

describe("subscriptionsModel.removeSubscription", () => {
  it("remove o cadastro, registra na auditoria e tira da economia", () => {
    const removida = subscriptionsModel.removeSubscription(2);

    expect(removida.nome).toBe("Academia Online");
    expect(subscriptionsModel.getSubscriptions().map((s) => s.id)).toEqual([1, 3]);
    expect(subscriptionsModel.getEconomiaTotal().economiaMensal).toBe(24.9);
    expect(subscriptionsModel.getAuditoria()[0]).toMatchObject({ assinaturaId: 2, acao: "removida" });
  });

  it("não reaproveita o id de uma assinatura removida", () => {
    subscriptionsModel.removeSubscription(3);
    expect(subscriptionsModel.addSubscription({ nome: "Nova", valorMensal: 10 }).id).toBe(4);
  });

  it("retorna null quando o id não existe", () => {
    expect(subscriptionsModel.removeSubscription(999)).toBeNull();
  });
});

describe("subscriptionsModel.getProximasCobrancas", () => {
  it("lista as cobranças da janela em ordem, com o total", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "Filmes", valorMensal: 39.9, ativo: true, dataBaseCobranca: "2026-01-05", diaCobranca: 5 },
      { id: 2, nome: "Música", valorMensal: 21.9, ativo: true, dataBaseCobranca: "2026-01-03", diaCobranca: 3 },
      { id: 3, nome: "Longe", valorMensal: 10, ativo: true, dataBaseCobranca: "2026-01-25", diaCobranca: 25 },
    ]);
    const proximas = subscriptionsModel.getProximasCobrancas({ dias: 7, ...em("2026-11-01") });

    expect(proximas).toMatchObject({ dias: 7, de: "2026-11-01", ate: "2026-11-08", total: 61.8, semData: 0 });
    expect(proximas.itens).toEqual([
      { id: 2, nome: "Música", data: "2026-11-03", diasRestantes: 2, valor: 21.9, suaParte: 21.9, tipo: "cobranca" },
      { id: 1, nome: "Filmes", data: "2026-11-05", diasRestantes: 4, valor: 39.9, suaParte: 39.9, tipo: "cobranca" },
    ]);
  });

  it("semanal aparece mais de uma vez na janela", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "Revista", valorCobrado: 5, ciclo: "semanal", ativo: true, dataBaseCobranca: "2026-11-02" },
    ]);
    const { itens } = subscriptionsModel.getProximasCobrancas({ dias: 14, ...em("2026-11-01") });
    expect(itens.map((i) => i.data)).toEqual(["2026-11-02", "2026-11-09"]);
  });

  it("mostra o fim do teste grátis e a volta da pausa", () => {
    subscriptionsModel._resetForTests([
      { id: 1, nome: "Filmes", valorMensal: 39.9, ativo: true, dataBaseCobranca: "2026-01-05", diaCobranca: 5 },
    ]);
    subscriptionsModel.addSubscription(
      { nome: "Idiomas", valorCobrado: 34.9, status: "teste", fimTeste: "2026-11-04" },
      em("2026-11-01")
    );
    subscriptionsModel.alterarStatus(1, { status: "pausada", pausadaAte: "2026-11-03" }, em("2026-11-01"));

    const { itens } = subscriptionsModel.getProximasCobrancas(em("2026-11-01"));
    expect(itens.map((i) => [i.nome, i.data, i.tipo])).toEqual([
      ["Idiomas", "2026-11-04", "fim_teste"],
      ["Filmes", "2026-11-05", "retomada"],
    ]);
  });

  it("cancelada fica de fora e quem não tem data conta em semData", () => {
    // SEED: uma ativa sem data de cobrança e duas canceladas
    expect(subscriptionsModel.getProximasCobrancas(em("2026-11-01"))).toMatchObject({
      semData: 1,
      itens: [],
      total: 0,
    });
  });

  it("plano dividido mostra a sua parte da cobrança", () => {
    subscriptionsModel._resetForTests([]);
    subscriptionsModel.addSubscription(
      { nome: "Família", valorCobrado: 60, compartilhadaCom: 2, diaCobranca: 2 },
      em("2026-11-01")
    );
    expect(subscriptionsModel.getProximasCobrancas(em("2026-11-01")).itens[0]).toMatchObject({
      valor: 60,
      suaParte: 20,
    });
  });

  it("a demo tem cobranças e um fim de teste na próxima semana", () => {
    subscriptionsModel._resetForTests(undefined, em("2026-11-01"));
    const proximas = subscriptionsModel.getProximasCobrancas(em("2026-11-01"));

    expect(proximas.itens.map((i) => i.tipo)).toEqual(["cobranca", "cobranca", "fim_teste", "cobranca"]);
    expect(proximas.total).toBe(129.6);
  });
});

describe("subscriptionsModel.getMeta", () => {
  it("traz categorias com tipos e rótulos, ciclos, status, limites e checklist", () => {
    const meta = subscriptionsModel.getMeta();

    expect(meta.categorias.map((c) => c.valor)).toEqual(subscriptionsModel.CATEGORIAS);
    expect(meta.categorias[0]).toEqual({
      valor: "streaming",
      rotulo: "Streaming",
      tipos: [
        { valor: "video", rotulo: "Vídeo", descricao: "streaming de vídeo" },
        { valor: "musica", rotulo: "Música", descricao: "streaming de música" },
      ],
    });
    expect(meta.ciclos.find((c) => c.valor === "anual")).toEqual({ valor: "anual", rotulo: "Anual", frase: "por ano" });
    expect(meta.status.map((s) => s.valor)).toEqual(["ativa", "teste", "pausada", "cancelada"]);
    expect(meta.limites).toEqual({ valorMensalMaximo: 10000, nomeMaximo: 60, compartilhadaComMaximo: 20 });
  });

  it("todo item do checklist tem categoria e tipo que existem", () => {
    subscriptionsModel.getMeta().checklist.forEach((item) => {
      const tiposDaCategoria = subscriptionsModel.TIPOS_POR_CATEGORIA[item.categoria];
      expect(tiposDaCategoria).toBeDefined();
      expect(item.tipo === null || tiposDaCategoria.includes(item.tipo)).toBe(true);
    });
  });
});