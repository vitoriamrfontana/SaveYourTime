/**
 * MODEL - Trava de Compras por Impulso (Cooldown 48h)
 * Integrante 4 - Trava Cooldown 48h
 *
 * Concentra o estado em memória da quarentena de desejos (padrão do MVP,
 * sem banco) e os três cálculos do motor preditivo:
 *
 *   1. Impulse Risk Score - cruza o valor do item com a renda e o valor-hora
 *      do usuário (+ o questionário reflexivo) e classifica o gasto em
 *      Baixo / Médio / Crítico.
 *   2. Controle de fases temporais - contagem regressiva exata das 48h a
 *      partir da data de inclusão, com verificação dos marcos de 12h, 24h e 48h.
 *   3. Auditoria de desfecho - registra desistência ou compra e soma quanto
 *      dinheiro (e quantas horas de trabalho) as desistências pouparam.
 *
 * O perfil do usuário (salário / valor-hora) entra por parâmetro, vindo do
 * controller, para não acoplar este model ao userModel.
 */

const PERIODO_COOLDOWN_HORAS = 48;
const MS_POR_HORA = 60 * 60 * 1000;
const HORAS_DIA_UTIL = 8;

// Pesos do Impulse Risk Score (somam 100 pontos)
const PESO_RENDA = 50;
const PESO_TEMPO = 30;
const PESO_REFLEXAO = 20;

// A partir destes valores o eixo já vale a pontuação cheia
const PERCENTUAL_RENDA_MAXIMO = 25; // 25% da renda mensal
const DIAS_TRABALHO_MAXIMO = 5; // uma semana útil de trabalho

// A partir daqui o motivo entra na explicação mostrada no card
const MOTIVO_RENDA_MINIMO = 10; // % da renda mensal
const MOTIVO_DIAS_MINIMO = 1; // dias úteis de trabalho

// Faixas de classificação do score (0 a 100)
const LIMITE_RISCO_MEDIO = 35;
const LIMITE_RISCO_CRITICO = 65;

const NIVEIS_RISCO = { BAIXO: 'Baixo', MEDIO: 'Médio', CRITICO: 'Crítico' };

const STATUS = {
  EM_ESPERA: 'em_espera',
  LIBERADO: 'liberado',
  DESISTIU: 'desistiu',
  COMPRADO: 'comprado',
};

const DESFECHOS = { DESISTIU: 'desistiu', COMPROU: 'comprou' };

const CATEGORIAS = ['eletronicos', 'vestuario', 'lazer', 'casa', 'outros'];
const CATEGORIA_PADRAO = 'outros';

// Frequência de uso declarada no questionário -> pontos de risco
const USOS_PREVISTOS = { diario: 0, semanal: 3, raro: 6 };
const PONTOS_USO_NEUTRO = 3;
const PONTOS_SEM_NECESSIDADE = 8;
const PONTOS_NECESSIDADE_NEUTRO = 4;
const PONTOS_TEM_ALTERNATIVA = 6;

// Fases temporais da quarentena, em horas decorridas desde a inclusão
const FASES = [
  {
    chave: 'impulso',
    titulo: 'Impulso quente',
    de: 0,
    ate: 12,
    orientacao: 'O desejo ainda está no pico. Não pesquise preço, só deixe descansar.',
  },
  {
    chave: 'analise',
    titulo: 'Análise',
    de: 12,
    ate: 24,
    orientacao: 'Hora de comparar alternativas e conferir se o item resolve algo real.',
  },
  {
    chave: 'decisao',
    titulo: 'Decisão',
    de: 24,
    ate: PERIODO_COOLDOWN_HORAS,
    orientacao: 'Se ainda fizer sentido depois de dormir duas vezes, a compra é consciente.',
  },
  {
    chave: 'liberado',
    titulo: 'Liberado',
    de: PERIODO_COOLDOWN_HORAS,
    ate: Infinity,
    orientacao: 'Reflexão concluída. Registre o desfecho: desisti ou comprei.',
  },
];

// Marcos verificados na régua das 48h (questionário reflexivo diário)
const MARCOS = [
  { horas: 12, titulo: 'Primeiras 12h', pergunta: 'O desejo diminuiu depois de algumas horas?' },
  { horas: 24, titulo: '24h de reflexão', pergunta: 'Você lembrou do item hoje sem abrir o app?' },
  {
    horas: PERIODO_COOLDOWN_HORAS,
    titulo: '48h - liberação',
    pergunta: 'Ainda vale trocar essas horas de trabalho por este item?',
  },
];

const MARCOS_HORAS = MARCOS.map((m) => m.horas);

let desejos = [];
let auditoria = [];
let proximoId = 1;

function arredondar(valor) {
  return Math.round(Number(valor || 0) * 100) / 100;
}

/** Converte o 'agora' recebido do controller (Date ou ISO) em texto ISO. */
function paraIso(agora) {
  return (agora instanceof Date ? agora : new Date(agora)).toISOString();
}

function horasAtras(horas) {
  return new Date(Date.now() - horas * MS_POR_HORA).toISOString();
}

function categoriaValida(categoria) {
  return CATEGORIAS.includes(categoria) ? categoria : CATEGORIA_PADRAO;
}

/**
 * Normaliza as respostas do questionário reflexivo. Retorna null quando o
 * usuário ainda não respondeu (o score então usa uma pontuação neutra).
 *
 * - necessidadeReal: é necessidade ou vontade?
 * - usoPrevisto: com que frequência pretende usar (diario | semanal | raro)
 * - alternativas: texto livre; se existe alternativa descrita, a compra é evitável
 */
function normalizarQuiz(quiz) {
  if (!quiz || typeof quiz !== 'object') return null;

  const { necessidadeReal, usoPrevisto, alternativas } = quiz;
  const usoNormalizado = String(usoPrevisto ?? '').toLowerCase();
  const alternativasTexto = String(alternativas ?? '').trim();

  // Formulário aberto e fechado sem responder nada não vira questionário: o
  // score volta para a pontuação neutra em vez de premiar quem pulou as perguntas.
  const temAlgumaResposta =
    necessidadeReal === true ||
    necessidadeReal === false ||
    Object.prototype.hasOwnProperty.call(USOS_PREVISTOS, usoNormalizado) ||
    alternativasTexto.length > 0;

  if (!temAlgumaResposta) return null;

  return {
    // Só true/false contam: null significa 'ainda não respondeu essa pergunta'
    necessidadeReal: typeof necessidadeReal === 'boolean' ? necessidadeReal : null,
    usoPrevisto: Object.prototype.hasOwnProperty.call(USOS_PREVISTOS, usoNormalizado)
      ? usoNormalizado
      : null,
    alternativas: alternativasTexto,
    temAlternativa: alternativasTexto.length > 0,
    respondidoEm: quiz.respondidoEm ?? new Date().toISOString(),
  };
}

function normalizarDesejo(bruto) {
  const id = Number(bruto.id) || proximoId;
  proximoId = Math.max(proximoId, id + 1);

  return {
    id,
    item: String(bruto.item).trim(),
    preco: arredondar(bruto.preco),
    categoria: categoriaValida(bruto.categoria),
    criadoEm: bruto.criadoEm ?? new Date().toISOString(),
    quiz: normalizarQuiz(bruto.quiz),
    desfecho: bruto.desfecho ?? null,
  };
}

function seedPadrao() {
  return [
    {
      id: 1,
      item: 'Fone de ouvido bluetooth top de linha',
      preco: 1299.9,
      categoria: 'eletronicos',
      criadoEm: horasAtras(2),
      quiz: { necessidadeReal: false, usoPrevisto: 'raro', alternativas: 'O fone atual ainda funciona' },
    },
    {
      id: 2,
      item: 'Tênis de corrida novo',
      preco: 549.9,
      categoria: 'vestuario',
      criadoEm: horasAtras(14),
      quiz: { necessidadeReal: true, usoPrevisto: 'semanal', alternativas: '' },
    },
    {
      id: 3,
      item: 'Cafeteira expresso',
      preco: 389.0,
      categoria: 'casa',
      criadoEm: horasAtras(30),
      quiz: null,
    },
    {
      id: 4,
      item: 'Ingresso de show',
      preco: 240.0,
      categoria: 'lazer',
      criadoEm: horasAtras(52),
      quiz: { necessidadeReal: false, usoPrevisto: 'raro', alternativas: '' },
    },
  ];
}

function inicializar(seed = seedPadrao()) {
  proximoId = 1;
  desejos = seed.map(normalizarDesejo);
  auditoria = [];
}

/* ------------------------------------------------------------------ *
 * 1. Impulse Risk Score
 * ------------------------------------------------------------------ */

/**
 * Cruza o preço do item com a renda mensal e o valor-hora do usuário e devolve
 * um score de 0 a 100 com a classificação do risco de impulso.
 *
 *   pontosRenda    (0-50): quanto o item consome da renda do mês
 *   pontosTempo    (0-30): quantos dias úteis de trabalho o item custa
 *   pontosReflexao (0-20): o que o próprio usuário respondeu no questionário
 */
function calcularRiscoImpulso(preco, quiz, perfil = {}) {
  const valor = arredondar(preco);
  const salario = Number(perfil.salario) || 0;
  const valorHora = Number(perfil.valorHora) || 0;

  const percentualRenda = salario > 0 ? (valor / salario) * 100 : null;
  const horasSuor = valorHora > 0 ? valor / valorHora : null;
  const diasTrabalho = horasSuor === null ? null : horasSuor / HORAS_DIA_UTIL;

  const pontosRenda =
    percentualRenda === null
      ? PESO_RENDA / 2
      : Math.min(percentualRenda / PERCENTUAL_RENDA_MAXIMO, 1) * PESO_RENDA;

  const pontosTempo =
    diasTrabalho === null
      ? PESO_TEMPO / 2
      : Math.min(diasTrabalho / DIAS_TRABALHO_MAXIMO, 1) * PESO_TEMPO;

  const motivos = [];
  let pontosReflexao = PESO_REFLEXAO / 2; // neutro enquanto o quiz não é respondido

  if (quiz) {
    pontosReflexao = 0;

    if (quiz.necessidadeReal === false) {
      pontosReflexao += PONTOS_SEM_NECESSIDADE;
      motivos.push('Você mesmo classificou como vontade, não necessidade.');
    } else if (quiz.necessidadeReal === null) {
      pontosReflexao += PONTOS_NECESSIDADE_NEUTRO; // pergunta ainda não respondida
    }

    pontosReflexao +=
      quiz.usoPrevisto === null ? PONTOS_USO_NEUTRO : USOS_PREVISTOS[quiz.usoPrevisto];
    if (quiz.usoPrevisto === 'raro') {
      motivos.push('Uso previsto raro: o item tende a virar objeto parado.');
    }

    if (quiz.temAlternativa) {
      pontosReflexao += PONTOS_TEM_ALTERNATIVA;
      motivos.push('Existe alternativa descrita por você, então a compra é evitável.');
    }
  }

  const score = Math.min(Math.round(pontosRenda + pontosTempo + pontosReflexao), 100);

  let nivel = NIVEIS_RISCO.BAIXO;
  if (score >= LIMITE_RISCO_CRITICO) nivel = NIVEIS_RISCO.CRITICO;
  else if (score >= LIMITE_RISCO_MEDIO) nivel = NIVEIS_RISCO.MEDIO;

  if (percentualRenda !== null && percentualRenda >= MOTIVO_RENDA_MINIMO) {
    motivos.push(`O item consome ${arredondar(percentualRenda)}% da sua renda mensal.`);
  }
  if (diasTrabalho !== null && diasTrabalho >= MOTIVO_DIAS_MINIMO) {
    motivos.push(`Custa ${arredondar(diasTrabalho)} dias úteis de trabalho.`);
  }
  if (motivos.length === 0) {
    motivos.push('Gasto proporcional à sua renda e ao seu tempo de trabalho.');
  }

  return {
    score,
    nivel,
    percentualRenda: percentualRenda === null ? null : arredondar(percentualRenda),
    horasSuor: horasSuor === null ? null : arredondar(horasSuor),
    diasTrabalho: diasTrabalho === null ? null : arredondar(diasTrabalho),
    componentes: {
      renda: arredondar(pontosRenda),
      tempo: arredondar(pontosTempo),
      reflexao: arredondar(pontosReflexao),
    },
    motivos,
  };
}

/* ------------------------------------------------------------------ *
 * 2. Controle de fases temporais
 * ------------------------------------------------------------------ */

function faseDe(horasDecorridas) {
  const fase =
    FASES.find((f) => horasDecorridas >= f.de && horasDecorridas < f.ate) ?? FASES[FASES.length - 1];

  return { chave: fase.chave, titulo: fase.titulo, orientacao: fase.orientacao };
}

/**
 * Cálculo regressivo exato das 48h a partir da data de inclusão, com o estado
 * de cada marco temporal (12h, 24h e 48h).
 */
function calcularFaseTemporal(criadoEm, agora = new Date()) {
  const inicio = new Date(criadoEm).getTime();
  const referencia = agora instanceof Date ? agora.getTime() : new Date(agora).getTime();
  const liberaEm = inicio + PERIODO_COOLDOWN_HORAS * MS_POR_HORA;

  const msDecorridos = Math.max(referencia - inicio, 0);
  const msRestantes = Math.max(liberaEm - referencia, 0);

  const horasDecorridas = msDecorridos / MS_POR_HORA;
  const concluido = msRestantes === 0;

  const marcos = MARCOS.map((marco) => ({
    horas: marco.horas,
    titulo: marco.titulo,
    pergunta: marco.pergunta,
    previstoPara: new Date(inicio + marco.horas * MS_POR_HORA).toISOString(),
    atingido: horasDecorridas >= marco.horas,
  }));

  return {
    criadoEm: new Date(inicio).toISOString(),
    liberaEm: new Date(liberaEm).toISOString(),
    periodoCooldownHoras: PERIODO_COOLDOWN_HORAS,
    horasDecorridas: arredondar(horasDecorridas),
    horasRestantes: Math.ceil(msRestantes / MS_POR_HORA),
    segundosRestantes: Math.ceil(msRestantes / 1000),
    progresso: arredondar(Math.min(horasDecorridas / PERIODO_COOLDOWN_HORAS, 1)),
    concluido,
    fase: faseDe(horasDecorridas),
    marcos,
    proximoMarco: marcos.find((m) => !m.atingido) ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Montagem dos itens (estado + motor preditivo)
 * ------------------------------------------------------------------ */

function statusDe(desejo, tempo) {
  if (desejo.desfecho) {
    return desejo.desfecho.tipo === DESFECHOS.DESISTIU ? STATUS.DESISTIU : STATUS.COMPRADO;
  }
  return tempo.concluido ? STATUS.LIBERADO : STATUS.EM_ESPERA;
}

function montarItem(desejo, perfil, agora) {
  const tempo = calcularFaseTemporal(desejo.criadoEm, agora);
  const risco = calcularRiscoImpulso(desejo.preco, desejo.quiz, perfil);

  return {
    id: desejo.id,
    item: desejo.item,
    preco: desejo.preco,
    categoria: desejo.categoria,
    criadoEm: desejo.criadoEm,
    liberaEm: tempo.liberaEm,
    status: statusDe(desejo, tempo),
    quiz: desejo.quiz ? { ...desejo.quiz } : null,
    horasSuor: risco.horasSuor,
    diasTrabalho: risco.diasTrabalho,
    risco,
    tempo,
    desfecho: desejo.desfecho ? { ...desejo.desfecho } : null,
  };
}

function encontrar(id) {
  return desejos.find((d) => d.id === Number(id)) ?? null;
}

function emQuarentena(item) {
  return item.status === STATUS.EM_ESPERA || item.status === STATUS.LIBERADO;
}

/* ------------------------------------------------------------------ *
 * API pública do model
 * ------------------------------------------------------------------ */

/** Itens em quarentena (em espera + liberados), do mais recente para o mais antigo. */
function getItems({ perfil = {}, agora = new Date() } = {}) {
  return desejos
    .map((d) => montarItem(d, perfil, agora))
    .filter(emQuarentena)
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
}

function getItemById(id, { perfil = {}, agora = new Date() } = {}) {
  const desejo = encontrar(id);
  return desejo ? montarItem(desejo, perfil, agora) : null;
}

function getResumo({ perfil = {}, agora = new Date() } = {}) {
  const itens = getItems({ perfil, agora });
  const emEspera = itens.filter((i) => i.status === STATUS.EM_ESPERA);
  const liberados = itens.filter((i) => i.status === STATUS.LIBERADO);

  const somar = (lista, campo) => lista.reduce((total, i) => total + (i[campo] || 0), 0);
  const { economiaTotal, horasPoupadas } = getAuditoria();

  return {
    totalEmEspera: emEspera.length,
    totalLiberados: liberados.length,
    valorRetido: arredondar(somar(itens, 'preco')),
    horasSuorRetidas: arredondar(somar(itens, 'horasSuor')),
    riscoCritico: itens.filter((i) => i.risco.nivel === NIVEIS_RISCO.CRITICO).length,
    economiaTotal,
    horasPoupadas,
    periodoCooldownHoras: PERIODO_COOLDOWN_HORAS,
    marcosHoras: MARCOS_HORAS,
  };
}

function addItem({ item, preco, categoria, quiz }, { perfil = {}, agora = new Date() } = {}) {
  const novoDesejo = normalizarDesejo({
    id: proximoId,
    item,
    preco,
    categoria,
    quiz,
    criadoEm: paraIso(agora),
  });

  desejos.push(novoDesejo);
  return montarItem(novoDesejo, perfil, agora);
}

/** Salva/atualiza as respostas do questionário reflexivo e recalcula o score. */
function responderQuiz(id, quiz, { perfil = {}, agora = new Date() } = {}) {
  const desejo = encontrar(id);
  if (!desejo) return null;

  const respostas = normalizarQuiz({ ...(desejo.quiz ?? {}), ...quiz, respondidoEm: undefined });
  desejo.quiz = respostas;

  return montarItem(desejo, perfil, agora);
}

/* ------------------------------------------------------------------ *
 * 3. Auditoria de desfecho
 * ------------------------------------------------------------------ */

/**
 * Encerra a quarentena de um desejo. `tipo` é 'desistiu' ou 'comprou'.
 * Desistência poupa o valor cheio do item; compra poupa zero.
 */
function registrarDesfecho(id, tipo, { perfil = {}, agora = new Date() } = {}) {
  const desejo = encontrar(id);
  if (!desejo) return null;
  if (desejo.desfecho) return { jaEncerrado: true, item: montarItem(desejo, perfil, agora) };

  const snapshot = montarItem(desejo, perfil, agora);
  const desistiu = tipo === DESFECHOS.DESISTIU;
  const valorPoupado = desistiu ? desejo.preco : 0;
  const horasPoupadas = desistiu ? snapshot.horasSuor ?? 0 : 0;

  desejo.desfecho = {
    tipo,
    registradoEm: paraIso(agora),
    valorPoupado,
    horasPoupadas,
    // Congela o estado do motor preditivo no momento da decisão
    scoreNoDesfecho: snapshot.risco.score,
    nivelNoDesfecho: snapshot.risco.nivel,
    horasDecorridas: snapshot.tempo.horasDecorridas,
    faseNoDesfecho: snapshot.tempo.fase.chave,
    concluiuCooldown: snapshot.tempo.concluido,
  };

  auditoria.push({
    id: auditoria.length + 1,
    desejoId: desejo.id,
    item: desejo.item,
    preco: desejo.preco,
    categoria: desejo.categoria,
    ...desejo.desfecho,
  });

  return { jaEncerrado: false, item: montarItem(desejo, perfil, agora) };
}

/** Histórico de desfechos (mais recente primeiro) + totais poupados. */
function getAuditoria() {
  const registros = auditoria.map((r) => ({ ...r })).reverse();
  const desistencias = registros.filter((r) => r.tipo === DESFECHOS.DESISTIU);
  const compras = registros.filter((r) => r.tipo === DESFECHOS.COMPROU);

  const somar = (lista, campo) => lista.reduce((total, r) => total + (r[campo] || 0), 0);
  const total = registros.length;

  return {
    registros,
    totalDecisoes: total,
    totalDesistencias: desistencias.length,
    totalCompras: compras.length,
    economiaTotal: arredondar(somar(desistencias, 'valorPoupado')),
    horasPoupadas: arredondar(somar(desistencias, 'horasPoupadas')),
    valorGasto: arredondar(somar(compras, 'preco')),
    taxaDesistencia: total > 0 ? arredondar((desistencias.length / total) * 100) : 0,
  };
}

inicializar();

module.exports = {
  getItems,
  getItemById,
  getResumo,
  addItem,
  responderQuiz,
  registrarDesfecho,
  getAuditoria,
  calcularRiscoImpulso,
  calcularFaseTemporal,
  CATEGORIAS,
  USOS_PREVISTOS,
  STATUS,
  DESFECHOS,
  NIVEIS_RISCO,
  PERIODO_COOLDOWN_HORAS,
  MARCOS,
  MARCOS_HORAS,
  // Apenas para testes
  _resetForTests: inicializar,
};
