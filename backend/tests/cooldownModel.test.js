const cooldownModel = require("../src/models/cooldownModel");

const PERFIL = { salario: 3500, horasMensais: 160, valorHora: 21.88 };

const MS_POR_HORA = 60 * 60 * 1000;
const AGORA = new Date("2026-01-10T12:00:00.000Z");

function horasAntes(horas) {
  return new Date(AGORA.getTime() - horas * MS_POR_HORA).toISOString();
}

const SEED = [
  {
    id: 1,
    item: "Fone caro",
    preco: 3000,
    categoria: "eletronicos",
    criadoEm: horasAntes(2),
    quiz: { necessidadeReal: false, usoPrevisto: "raro", alternativas: "O antigo funciona" },
  },
  { id: 2, item: "Caneca", preco: 100, categoria: "casa", criadoEm: horasAntes(13), quiz: null },
  { id: 3, item: "Ingresso", preco: 240, categoria: "lazer", criadoEm: horasAntes(50), quiz: null },
];

const ctx = { perfil: PERFIL, agora: AGORA };

beforeEach(() => {
  cooldownModel._resetForTests(SEED);
});

describe("cooldownModel.calcularRiscoImpulso", () => {
  it("classifica como Crítico o item que consome boa parte da renda e do tempo", () => {
    const risco = cooldownModel.calcularRiscoImpulso(3000, null, PERFIL);

    expect(risco.nivel).toBe("Crítico");
    expect(risco.score).toBeGreaterThanOrEqual(65);
    expect(risco.percentualRenda).toBeCloseTo(85.71, 1);
    expect(risco.horasSuor).toBeCloseTo(137.11, 1);
  });

  it("classifica como Baixo um gasto pequeno diante da renda", () => {
    const risco = cooldownModel.calcularRiscoImpulso(100, null, PERFIL);

    expect(risco.nivel).toBe("Baixo");
    expect(risco.score).toBeLessThan(35);
  });

  it("satura em 100 pontos, por mais caro que seja o item", () => {
    const semQuiz = cooldownModel.calcularRiscoImpulso(999999, null, PERFIL);
    const comQuizRuim = cooldownModel.calcularRiscoImpulso(
      999999,
      { necessidadeReal: false, usoPrevisto: "raro", alternativas: "Qualquer outra coisa", temAlternativa: true },
      PERFIL
    );

    // Sem questionário a reflexão entra neutra (10 dos 20 pontos possíveis)
    expect(semQuiz.score).toBe(90);
    expect(comQuizRuim.score).toBe(100);
  });

  it("o questionário reflexivo aumenta o score do mesmo item", () => {
    const semQuiz = cooldownModel.calcularRiscoImpulso(500, null, PERFIL);
    const comQuizRuim = cooldownModel.calcularRiscoImpulso(
      500,
      { necessidadeReal: false, usoPrevisto: "raro", alternativas: "Dá para usar o antigo", temAlternativa: true },
      PERFIL
    );
    const comQuizBom = cooldownModel.calcularRiscoImpulso(
      500,
      { necessidadeReal: true, usoPrevisto: "diario", alternativas: "", temAlternativa: false },
      PERFIL
    );

    expect(comQuizRuim.score).toBeGreaterThan(semQuiz.score);
    expect(comQuizBom.score).toBeLessThan(semQuiz.score);
  });

  it("usa pontuação neutra quando o perfil não tem salário nem valor-hora", () => {
    const risco = cooldownModel.calcularRiscoImpulso(500, null, {});

    expect(risco.percentualRenda).toBeNull();
    expect(risco.horasSuor).toBeNull();
    expect(risco.score).toBe(50); // 25 (renda) + 15 (tempo) + 10 (reflexão)
  });
});

describe("cooldownModel.calcularFaseTemporal", () => {
  it("calcula o tempo restante exato a partir da data de inclusão", () => {
    const tempo = cooldownModel.calcularFaseTemporal(horasAntes(13), AGORA);

    expect(tempo.horasDecorridas).toBeCloseTo(13, 5);
    expect(tempo.horasRestantes).toBe(35);
    expect(tempo.segundosRestantes).toBe(35 * 3600);
    expect(tempo.progresso).toBeCloseTo(13 / 48, 2);
    expect(tempo.concluido).toBe(false);
  });

  it("marca os marcos de 12h, 24h e 48h conforme o tempo decorrido", () => {
    const tempo = cooldownModel.calcularFaseTemporal(horasAntes(25), AGORA);
    const atingidos = tempo.marcos.filter((m) => m.atingido).map((m) => m.horas);

    expect(tempo.marcos.map((m) => m.horas)).toEqual([12, 24, 48]);
    expect(atingidos).toEqual([12, 24]);
    expect(tempo.proximoMarco.horas).toBe(48);
  });

  it("muda de fase conforme a régua das 48h", () => {
    expect(cooldownModel.calcularFaseTemporal(horasAntes(1), AGORA).fase.chave).toBe("impulso");
    expect(cooldownModel.calcularFaseTemporal(horasAntes(13), AGORA).fase.chave).toBe("analise");
    expect(cooldownModel.calcularFaseTemporal(horasAntes(30), AGORA).fase.chave).toBe("decisao");
    expect(cooldownModel.calcularFaseTemporal(horasAntes(50), AGORA).fase.chave).toBe("liberado");
  });

  it("zera a contagem (sem valores negativos) depois das 48h", () => {
    const tempo = cooldownModel.calcularFaseTemporal(horasAntes(80), AGORA);

    expect(tempo.horasRestantes).toBe(0);
    expect(tempo.segundosRestantes).toBe(0);
    expect(tempo.progresso).toBe(1);
    expect(tempo.concluido).toBe(true);
  });
});

describe("cooldownModel.getItems / getResumo", () => {
  it("devolve os desejos em quarentena com status calculado", () => {
    const itens = cooldownModel.getItems(ctx);
    const porId = Object.fromEntries(itens.map((i) => [i.id, i]));

    expect(itens).toHaveLength(3);
    expect(porId[1].status).toBe("em_espera");
    expect(porId[3].status).toBe("liberado");
  });

  it("soma o valor e as horas retidas no resumo", () => {
    const resumo = cooldownModel.getResumo(ctx);

    expect(resumo.totalEmEspera).toBe(2);
    expect(resumo.totalLiberados).toBe(1);
    expect(resumo.valorRetido).toBe(3340);
    expect(resumo.riscoCritico).toBe(1);
    expect(resumo.periodoCooldownHoras).toBe(48);
  });

  it("não expõe itens já encerrados na lista da tela", () => {
    cooldownModel.registrarDesfecho(3, "desistiu", ctx);
    const ids = cooldownModel.getItems(ctx).map((i) => i.id);

    expect(ids).not.toContain(3);
    expect(ids).toHaveLength(2);
  });
});

describe("cooldownModel.addItem / responderQuiz", () => {
  it("adiciona um desejo já com as 48h contando a partir de agora", () => {
    const novo = cooldownModel.addItem({ item: "Monitor", preco: 1200, categoria: "eletronicos" }, ctx);

    expect(novo.id).toBe(4);
    expect(novo.status).toBe("em_espera");
    expect(novo.tempo.horasRestantes).toBe(48);
    expect(cooldownModel.getItems(ctx)).toHaveLength(4);
  });

  it("aplica a categoria padrão quando ela não é informada", () => {
    const novo = cooldownModel.addItem({ item: "Algo", preco: 50 }, ctx);
    expect(novo.categoria).toBe("outros");
  });

  it("questionário enviado em branco vale o mesmo que não responder", () => {
    const semQuiz = cooldownModel.addItem({ item: "A", preco: 800 }, ctx);
    const quizVazio = cooldownModel.addItem(
      { item: "B", preco: 800, quiz: { necessidadeReal: null, usoPrevisto: null, alternativas: "" } },
      ctx
    );

    expect(quizVazio.quiz).toBeNull();
    expect(quizVazio.risco.score).toBe(semQuiz.risco.score);
  });

  it("recalcula o score depois das respostas do questionário", () => {
    const antes = cooldownModel.getItemById(2, ctx).risco.score;
    const depois = cooldownModel.responderQuiz(
      2,
      { necessidadeReal: false, usoPrevisto: "raro", alternativas: "Já tenho uma" },
      ctx
    );

    expect(depois.risco.score).toBeGreaterThan(antes);
    expect(depois.quiz.temAlternativa).toBe(true);
  });

  it("não trata pergunta sem resposta como 'é só vontade'", () => {
    const parcial = cooldownModel.responderQuiz(2, { usoPrevisto: "diario" }, ctx);
    const respondido = cooldownModel.responderQuiz(
      2,
      { necessidadeReal: false, usoPrevisto: "diario" },
      ctx
    );

    expect(parcial.quiz.necessidadeReal).toBeNull();
    expect(parcial.risco.componentes.reflexao).toBe(4); // neutro, não os 8 de 'é vontade'
    expect(respondido.risco.score).toBeGreaterThan(parcial.risco.score);
  });

  it("retorna null ao responder o questionário de um id inexistente", () => {
    expect(cooldownModel.responderQuiz(999, { usoPrevisto: "raro" }, ctx)).toBeNull();
  });
});

describe("cooldownModel.registrarDesfecho / getAuditoria", () => {
  it("desistir poupa o valor cheio do item", () => {
    const { item } = cooldownModel.registrarDesfecho(3, "desistiu", ctx);

    expect(item.status).toBe("desistiu");
    expect(item.desfecho.valorPoupado).toBe(240);
    expect(item.desfecho.horasPoupadas).toBeGreaterThan(0);
    expect(item.desfecho.concluiuCooldown).toBe(true);
  });

  it("comprar encerra a quarentena sem gerar economia", () => {
    const { item } = cooldownModel.registrarDesfecho(1, "comprou", ctx);

    expect(item.status).toBe("comprado");
    expect(item.desfecho.valorPoupado).toBe(0);
    expect(item.desfecho.faseNoDesfecho).toBe("impulso");
    expect(item.desfecho.concluiuCooldown).toBe(false);
  });

  it("não deixa encerrar duas vezes o mesmo desejo", () => {
    cooldownModel.registrarDesfecho(3, "desistiu", ctx);
    const segundaTentativa = cooldownModel.registrarDesfecho(3, "comprou", ctx);

    expect(segundaTentativa.jaEncerrado).toBe(true);
    expect(segundaTentativa.item.desfecho.tipo).toBe("desistiu");
  });

  it("retorna null quando o id não existe", () => {
    expect(cooldownModel.registrarDesfecho(999, "desistiu", ctx)).toBeNull();
  });

  it("soma na auditoria só o que foi cancelado", () => {
    cooldownModel.registrarDesfecho(3, "desistiu", ctx);
    cooldownModel.registrarDesfecho(2, "desistiu", ctx);
    cooldownModel.registrarDesfecho(1, "comprou", ctx);

    const auditoria = cooldownModel.getAuditoria();

    expect(auditoria.totalDecisoes).toBe(3);
    expect(auditoria.totalDesistencias).toBe(2);
    expect(auditoria.economiaTotal).toBe(340);
    expect(auditoria.valorGasto).toBe(3000);
    expect(auditoria.taxaDesistencia).toBeCloseTo(66.67, 1);
    // Mais recente primeiro
    expect(auditoria.registros[0].desejoId).toBe(1);
  });

  it("começa zerada e reflete a economia no resumo da tela", () => {
    expect(cooldownModel.getAuditoria().economiaTotal).toBe(0);

    cooldownModel.registrarDesfecho(3, "desistiu", ctx);

    expect(cooldownModel.getResumo(ctx).economiaTotal).toBe(240);
  });
});

describe("cooldownModel.sugerirPeriodo", () => {
  it("sugere 48h para item cotidiano", () => {
    expect(cooldownModel.sugerirPeriodo(100, PERFIL).chave).toBe("curto");
  });

  it("sugere 7 dias acima de 10% do salário", () => {
    const sugestao = cooldownModel.sugerirPeriodo(500, PERFIL);

    expect(sugestao.chave).toBe("intermediario");
    expect(sugestao.horas).toBe(168);
    expect(sugestao.percentualRenda).toBeCloseTo(14.29, 1);
  });

  it("aplica a Regra dos 30 Dias só quando supera 40% do salário", () => {
    expect(cooldownModel.sugerirPeriodo(1400, PERFIL).chave).toBe("intermediario"); // exatos 40%
    expect(cooldownModel.sugerirPeriodo(1401, PERFIL).chave).toBe("estendido");
    expect(cooldownModel.sugerirPeriodo(1401, PERFIL).horas).toBe(720);
  });

  it("fica nas 48h quando o perfil não tem salário", () => {
    const sugestao = cooldownModel.sugerirPeriodo(10000, {});

    expect(sugestao.chave).toBe("curto");
    expect(sugestao.percentualRenda).toBeNull();
  });

  it("identifica período mais curto que o sugerido", () => {
    expect(cooldownModel.periodoMaisCurto("curto", "estendido")).toBe(true);
    expect(cooldownModel.periodoMaisCurto("estendido", "intermediario")).toBe(false);
    expect(cooldownModel.periodoMaisCurto("curto", "curto")).toBe(false);
  });
});

describe("cooldownModel - quarentena estendida", () => {
  it("escala fases e marcos para os 30 dias", () => {
    const tempo = cooldownModel.calcularFaseTemporal(horasAntes(200), AGORA, 720);

    expect(tempo.marcos.map((m) => m.horas)).toEqual([180, 360, 720]);
    expect(tempo.marcos.map((m) => m.rotulo)).toEqual(["7,5d", "15d", "30d"]);
    expect(tempo.fase.chave).toBe("analise");
    expect(tempo.horasRestantes).toBe(520);
    expect(tempo.periodoCooldownHoras).toBe(720);
  });

  it("adiciona o desejo com o período escolhido e separa no resumo", () => {
    const novo = cooldownModel.addItem(
      { item: "Notebook", preco: 5000, categoria: "eletronicos", periodo: "estendido" },
      ctx
    );

    expect(novo.periodo).toEqual({ chave: "estendido", horas: 720, rotulo: "30 dias" });
    expect(novo.tempo.horasRestantes).toBe(720);
    expect(novo.status).toBe("em_espera");
    expect(cooldownModel.getResumo(ctx).porPeriodo).toEqual({
      estendido: 1,
      intermediario: 0,
      curto: 3,
    });
  });

  it("item de 30 dias segue em espera depois de 48h", () => {
    cooldownModel._resetForTests([
      { id: 1, item: "TV", preco: 4000, criadoEm: horasAntes(50), periodo: "estendido" },
    ]);

    expect(cooldownModel.getItemById(1, ctx).status).toBe("em_espera");
  });

  it("período inválido cai na quarentena padrão de 48h", () => {
    const novo = cooldownModel.addItem({ item: "X", preco: 10, periodo: "eterno" }, ctx);
    expect(novo.periodo.chave).toBe("curto");
  });

  it("registra o período no histórico de desfecho", () => {
    cooldownModel.registrarDesfecho(3, "desistiu", ctx);
    expect(cooldownModel.getAuditoria().registros[0].periodo.chave).toBe("curto");
  });
});

describe("cooldownModel.calcularStreakDisciplina", () => {
  const INICIO = horasAntes(20 * 24);

  beforeEach(() => {
    cooldownModel._resetForTests(SEED, { inicioDisciplina: INICIO });
  });

  it("conta os dias desde o início do monitoramento quando não há compra por impulso", () => {
    const streak = cooldownModel.calcularStreakDisciplina({ agora: AGORA });

    expect(streak.diasSeguidos).toBe(20);
    expect(streak.recorde).toBe(20);
    expect(streak.proximaMeta).toEqual({ dias: 30, faltam: 10 });
    expect(streak.mensagem).toBe("Fogo da Disciplina: 20 dias seguidos sem compras por impulso");
  });

  it("compra antes do fim da quarentena zera a sequência e preserva o recorde", () => {
    cooldownModel.registrarDesfecho(1, "comprou", ctx); // item 1 tem só 2h de quarentena
    const streak = cooldownModel.calcularStreakDisciplina({ agora: AGORA });

    expect(streak.diasSeguidos).toBe(0);
    expect(streak.recorde).toBe(20);
    expect(streak.totalComprasImpulsivas).toBe(1);
    expect(streak.ultimaCompraImpulsiva.item).toBe("Fone caro");
  });

  it("compra depois da quarentena concluída não quebra a sequência", () => {
    cooldownModel.registrarDesfecho(3, "comprou", ctx); // 50h de 48h: consciente
    const streak = cooldownModel.calcularStreakDisciplina({ agora: AGORA });

    expect(streak.diasSeguidos).toBe(20);
    expect(streak.totalComprasImpulsivas).toBe(0);
  });

  it("volta a contar a partir da última compra por impulso", () => {
    cooldownModel.registrarDesfecho(1, "comprou", ctx);
    const depois = new Date(AGORA.getTime() + 3 * 24 * MS_POR_HORA + 1000);

    expect(cooldownModel.calcularStreakDisciplina({ agora: depois }).diasSeguidos).toBe(3);
  });

  it("usa singular para 1 dia", () => {
    const streak = cooldownModel.calcularStreakDisciplina({
      agora: new Date(new Date(INICIO).getTime() + 25 * MS_POR_HORA),
    });
    expect(streak.mensagem).toContain("1 dia seguido sem");
  });
});
