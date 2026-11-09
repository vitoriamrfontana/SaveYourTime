function obterApiUrlPadrao() {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const protocolo = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocolo}//${window.location.hostname}:3000/api`;
  }

  return 'http://10.0.2.2:3000/api';
}

const API_URL = obterApiUrlPadrao();

if (!(typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL)) {
  console.warn(`[api.js] EXPO_PUBLIC_API_URL não definida. Usando ${API_URL}.`);
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { signal: customSignal, ...fetchOptions } = options;
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...fetchOptions,
      signal: customSignal || controller.signal,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        json?.error?.message ||
        json?.message ||
        json?.erro ||
        `Erro ${res.status} ao acessar ${path}`;
      throw new Error(message);
    }

    return json?.success && Object.prototype.hasOwnProperty.call(json, 'data')
      ? json.data
      : json;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Tempo limite ao acessar a API (${API_URL}${path}). Verifique se o backend está rodando.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const getHealth = () => request('/health');

export const getPerfil = () => request('/user');

export const fetchPerfil = async () => {
  try {
    return await getPerfil();
  } catch (error) {
    return { nome: 'Maria Silva', salario: 3500, horasMensais: 160, valorHora: 21.88 };
  }
};

export const updatePerfil = (salario, horasMensais, nome, metaEconomia) =>
  request('/user', {
    method: 'PUT',
    body: JSON.stringify({ nome, salario, horasMensais, metaEconomia }),
  });

export const simularHorasSuor = async (item, preco, categoria = 'Outros', valorHoraActual) => {
  const precoNum = Number(preco);
  const vHora = Number(valorHoraActual) || 21.88;

  try {
    const data = await request('/simulate', {
      method: 'POST',
      body: JSON.stringify({ item, preco: precoNum, categoria }),
    });
    return data;
  } catch (error) {
    const horasSuor = Number((precoNum / vHora).toFixed(1));
    const diasTrabalho = Number((horasSuor / 8).toFixed(1));
    const salarioMensal = vHora * 160;
    const percentualSalario = Number(((precoNum / salarioMensal) * 100).toFixed(1));

    return {
      simulacao: {
        id: 'sim-' + Date.now(),
        item,
        preco: precoNum,
        categoria,
        horasSuor,
        diasTrabalho,
        percentualSalario,
        nivelImpacto: percentualSalario > 20 ? 'Critico' : percentualSalario > 5 ? 'Moderado' : 'Baixo',
        data: new Date().toISOString()
      },
      precoItem: precoNum,
      horasSuor,
      diasTrabalho,
      percentualSalario,
      mensagem: `O item "${item}" (R$ ${precoNum.toFixed(2)}) custara ${horasSuor} horas (${diasTrabalho} dias uteis) do seu trabalho.`
    };
  }
};

export const getSimulationHistory = async () => {
  try {
    const res = await request('/simulate/history');
    return Array.isArray(res) ? res : (res?.data || []);
  } catch (error) {
    return [];
  }
};

export const deleteSimulation = async (id) => {
  try {
    return await request(`/simulate/history/${id}`, { method: 'DELETE' });
  } catch (error) {
    return { success: false };
  }
};

export const updateSimulationStatus = async (id, status) => {
  try {
    return await request(`/simulate/history/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  } catch (error) {
    return { success: false };
  }
};

export const getHealthScore = async () => {
  try {
    const res = await request('/simulate/health-score');
    return res?.data || res;
  } catch (error) {
    return {
      score: 72,
      classificacao: 'Bom',
      totalSimulacoes: 0,
      totalSimuladoReais: 0,
      totalHorasSimuladas: 0,
      horasPoupadas: 0,
      dinheiroPoupado: 0,
      dicas: [
        'Colocar gastos acima de 15h de trabalho no Cooldown preserva seu saldo.',
        'Mantenha gastos superfluos dentro do teto de 30% da regra 50-30-20.'
      ]
    };
  }
};

export const getHealthScoreTimeline = async () => {
  try {
    const res = await request('/simulate/analytics/timeline');
    return res?.data || res;
  } catch (error) {
    return {
      evolucao: [
        { periodo: 'Sem 1', data: '08/09', score: 58, variacao: '+0', horasPoupadas: 18.5, status: 'Inicio' },
        { periodo: 'Sem 2', data: '15/09', score: 64, variacao: '+6', horasPoupadas: 42.0, status: 'Evolucao' },
        { periodo: 'Sem 3', data: '22/09', score: 68, variacao: '+4', horasPoupadas: 78.4, status: 'Evolucao' },
        { periodo: 'Sem 4', data: '29/09', score: 72, variacao: '+4', horasPoupadas: 120.1, status: 'Estavel' },
        { periodo: 'Sem 5', data: '06/10', score: 79, variacao: '+7', horasPoupadas: 154.6, status: 'Avanco' },
        { periodo: 'Sem 6', data: '13/10', score: 85, variacao: '+6', horasPoupadas: 191.9, status: 'Excelente' }
      ],
      scoreAtual: 85,
      classificacao: 'Excelente',
      comparativoMesAnterior: {
        scoreAtual: 85,
        scoreAnterior: 68,
        diferenca: 17,
        percentualCrescimento: 25,
        tendencia: 'Crescimento Acelerado'
      }
    };
  }
};

export const getUserBadges = async () => {
  try {
    const res = await request('/simulate/badges');
    return res?.data || res;
  } catch (error) {
    return {
      badges: [
        {
          id: 'badge-cooldown-master',
          titulo: 'Mestre do Cooldown',
          descricao: 'Evitou compras colocando desejos impulsivos na quarentena reflexiva.',
          categoria: 'Autocontrole',
          desbloqueado: true,
          progressoTexto: '5 de 5 compras',
          porcentagem: 100,
          nivel: 'Ouro',
          dataDesbloqueio: '12/10/2026'
        },
        {
          id: 'badge-semana-zero-impulso',
          titulo: 'Zero Impulso na Semana',
          descricao: 'Completou 7 dias consecutivos sem compras superfluas nao planejadas.',
          categoria: 'Habito',
          desbloqueado: true,
          progressoTexto: '7 de 7 dias',
          porcentagem: 100,
          nivel: 'Prata',
          dataDesbloqueio: '14/10/2026'
        },
        {
          id: 'badge-guardiao-orcamento',
          titulo: 'Guardiao do Orcamento',
          descricao: 'Alcancou Financial Health Score igual ou superior a 80 pontos.',
          categoria: 'Pontuacao',
          desbloqueado: true,
          progressoTexto: '85 de 80 pontos',
          porcentagem: 100,
          nivel: 'Ouro',
          dataDesbloqueio: '15/10/2026'
        },
        {
          id: 'badge-100h-poupadas',
          titulo: '100 Horas de Vida Poupadas',
          descricao: 'Acumulou mais de 100 horas uteis de trabalho poupadas em despesas evitadas.',
          categoria: 'Tempo',
          desbloqueado: true,
          progressoTexto: '191.9h poupadas',
          porcentagem: 100,
          nivel: 'Diamante',
          dataDesbloqueio: '16/10/2026'
        },
        {
          id: 'badge-simulador-consciente',
          titulo: 'Calculador Consciente',
          descricao: 'Simulou o custo em horas de trabalho de pelo menos 5 produtos.',
          categoria: 'Engajamento',
          desbloqueado: false,
          progressoTexto: '3 de 5 simulacoes',
          porcentagem: 60,
          nivel: 'Bronze',
          dataDesbloqueio: null
        },
        {
          id: 'badge-poupanca-ouro',
          titulo: 'Reserva Blindada',
          descricao: 'Economizou mais de R$ 5.000,00 desistindo de compras antes de passar o cartao.',
          categoria: 'Financas',
          desbloqueado: false,
          progressoTexto: 'R$ 4.199 de R$ 5.000',
          porcentagem: 84,
          nivel: 'Platina',
          dataDesbloqueio: null
        }
      ],
      totalBadges: 6,
      desbloqueadosCount: 4,
      taxaConclusaoPercentual: 67
    };
  }
};

export const getFinancialGoals = async (valorHora = 21.88) => {
  try {
    const res = await request(`/simulate/goals?valorHora=${valorHora}`);
    return res?.data || res;
  } catch (error) {
    const vHora = Number(valorHora) || 21.88;
    const custoVidaDiario = Number((3500 / 30).toFixed(2));
    const metasMock = [
      {
        id: 'meta-reserva-emergencia',
        titulo: 'Reserva de Emergencia (6 Meses)',
        categoria: 'Seguranca',
        valorAlvo: 15000.00,
        valorAtual: 9000.00,
        restante: 6000.00,
        progressoPct: 60,
        horasTrabalhoAlvo: Number((15000 / vHora).toFixed(1)),
        horasTrabalhoAtuais: Number((9000 / vHora).toFixed(1)),
        horasTrabalhoRestantes: Number((6000 / vHora).toFixed(1)),
        diasTrabalhoRestantes: Number(((6000 / vHora) / 8).toFixed(1)),
        diasLiberdadeConquistados: Number((9000 / custoVidaDiario).toFixed(1)),
        diasLiberdadeAlvo: Number((15000 / custoVidaDiario).toFixed(1)),
        concluida: false
      },
      {
        id: 'meta-viagem-sonhos',
        titulo: 'Viagem de Ferias Sem Dividas',
        categoria: 'Experiencia',
        valorAlvo: 5000.00,
        valorAtual: 3750.00,
        restante: 1250.00,
        progressoPct: 75,
        horasTrabalhoAlvo: Number((5000 / vHora).toFixed(1)),
        horasTrabalhoAtuais: Number((3750 / vHora).toFixed(1)),
        horasTrabalhoRestantes: Number((1250 / vHora).toFixed(1)),
        diasTrabalhoRestantes: Number(((1250 / vHora) / 8).toFixed(1)),
        diasLiberdadeConquistados: Number((3750 / custoVidaDiario).toFixed(1)),
        diasLiberdadeAlvo: Number((5000 / custoVidaDiario).toFixed(1)),
        concluida: false
      },
      {
        id: 'meta-ano-sabatico',
        titulo: 'Fundo de Liberdade / Ano Sabatico',
        categoria: 'Liberdade',
        valorAlvo: 42000.00,
        valorAtual: 14000.00,
        restante: 28000.00,
        progressoPct: 33,
        horasTrabalhoAlvo: Number((42000 / vHora).toFixed(1)),
        horasTrabalhoAtuais: Number((14000 / vHora).toFixed(1)),
        horasTrabalhoRestantes: Number((28000 / vHora).toFixed(1)),
        diasTrabalhoRestantes: Number(((28000 / vHora) / 8).toFixed(1)),
        diasLiberdadeConquistados: Number((14000 / custoVidaDiario).toFixed(1)),
        diasLiberdadeAlvo: Number((42000 / custoVidaDiario).toFixed(1)),
        concluida: false
      }
    ];
    const totalAlvo = metasMock.reduce((a, b) => a + b.valorAlvo, 0);
    const totalAtual = metasMock.reduce((a, b) => a + b.valorAtual, 0);
    const totalRestante = totalAlvo - totalAtual;
    return {
      resumoGeral: {
        totalMetas: metasMock.length,
        totalAlvo,
        totalAcumulado: totalAtual,
        totalRestante,
        progressoGeralPct: Math.round((totalAtual / totalAlvo) * 100),
        diasLiberdadeConquistados: Number((totalAtual / custoVidaDiario).toFixed(1)),
        horasVidaPoupadas: Number((totalAtual / vHora).toFixed(1)),
        diasTrabalhoRestantes: Number(((totalRestante / vHora) / 8).toFixed(1)),
        dinheiroPoupadoCooldown: 4199.00,
        custoVidaDiarioReferencia: custoVidaDiario,
        valorHoraReferencia: vHora
      },
      metas: metasMock
    };
  }
};

export const createFinancialGoal = async (meta) => {
  try {
    const res = await request('/simulate/goals', {
      method: 'POST',
      body: JSON.stringify(meta)
    });
    return res?.data || res;
  } catch (error) {
    return {
      id: 'meta-' + Date.now(),
      titulo: meta.titulo,
      categoria: meta.categoria || 'Geral',
      valorAlvo: Number(meta.valorAlvo),
      valorAtual: Number(meta.valorAtual || 0),
      dataCriacao: new Date().toISOString()
    };
  }
};

export const depositToFinancialGoal = async (id, valor) => {
  try {
    const res = await request(`/simulate/goals/${id}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ valor: Number(valor) })
    });
    return res?.data || res;
  } catch (error) {
    return { success: true, id, valor };
  }
};

export const simulateGoalSavingImpact = async (valorPoupado, valorHora = 21.88) => {
  try {
    const res = await request(`/simulate/goals/impact?valorHora=${valorHora}`, {
      method: 'POST',
      body: JSON.stringify({ valorPoupado: Number(valorPoupado) })
    });
    return res?.data || res;
  } catch (error) {
    const vHora = Number(valorHora) || 21.88;
    const custoVidaDiario = Number((3500 / 30).toFixed(2));
    const valor = Number(valorPoupado) || 0;
    const horasTrabalhoPoupadas = Number((valor / vHora).toFixed(1));
    const diasUteisPoupados = Number((horasTrabalhoPoupadas / 8).toFixed(1));
    const diasLiberdadeGanhos = custoVidaDiario > 0 ? Number((valor / custoVidaDiario).toFixed(1)) : 0;
    return {
      valorSimulado: valor,
      horasTrabalhoPoupadas,
      diasUteisPoupados,
      diasLiberdadeGanhos,
      mensagem: 'Ao desistir ou economizar R$ ' + valor.toFixed(2) + ', voce antecipa suas metas em ' + diasLiberdadeGanhos + ' dias de liberdade financeira sem trabalhar.'
    };
  }
};

export const fetchPotes = async (salarioActual) => {
  try {
    return await getPotes();
  } catch (error) {
    const salario = salarioActual || 3500;
    return {
      salario,
      limites: {
        sobrevivencia: salario * 0.5,
        estiloVida: salario * 0.3,
        dividas: salario * 0.2,
      },
      atual: { sobrevivencia: 1650, estiloVida: 1150, dividas: 500 },
    };
  }
};

export const getAssinaturas = () => request('/subscriptions');
export const getCooldown = () => request('/cooldown');

export const criarDesejoCooldown = (desejo) =>
  request('/cooldown', {
    method: 'POST',
    body: JSON.stringify(desejo),
  });

export const responderQuizCooldown = (id, respostas) =>
  request(`/cooldown/${id}/quiz`, {
    method: 'PATCH',
    body: JSON.stringify(respostas),
  });

export const desistirDesejoCooldown = (id) =>
  request(`/cooldown/${id}/desisti`, { method: 'PATCH' });

export const comprarDesejoCooldown = (id) =>
  request(`/cooldown/${id}/comprei`, { method: 'PATCH' });

export const getAuditoriaCooldown = () => request('/cooldown/auditoria');

// Sprint 3 - Quarentena Estendida: período proporcional (48h / 7 dias / 30 dias)
export const createExtendedCooldown = (dados) =>
  request('/cooldown/extended', {
    method: 'POST',
    body: JSON.stringify(dados),
  });

// Fogo da Disciplina: dias seguidos sem compra por impulso
export const getDisciplineStreak = () => request('/cooldown/streak');

// Sprint 4 - Antirrecaída: freio de emergência. Tudo opcional:
// { gatilho, desejoId, valor }. Trava o registro de compras por 30 min e
// devolve a respiração guiada e as mensagens de impacto financeiro.
export const triggerCooldownPanicMode = (dados = {}) =>
  request('/cooldown/panic-mode', {
    method: 'POST',
    body: JSON.stringify(dados),
  });

// Auditoria final: gatilhos superados, conversão x desistência e maturidade
export const getCooldownTriggersAnalytics = () => request('/cooldown/analytics/triggers');
export const getPotes = (mes) => request(`/pots${mes ? `?mes=${encodeURIComponent(mes)}` : ''}`);

export const checkPurchaseBudgetImpact = (valor, categoria) =>
  request('/pots/check-purchase', {
    method: 'POST',
    body: JSON.stringify({ valor: Number(String(valor).replace(',', '.')), categoria }),
  });

// Fechamento mensal 50-30-20: diagnóstico da competência (padrão: mês atual).
export const closeMonthlyPots = (mes) =>
  request('/pots/month-close', {
    method: 'POST',
    body: JSON.stringify(mes ? { mes } : {}),
  });

export const getMonthlyCloseHistory = () => request('/pots/month-close');

// Reequilíbrio de sobras. dados: { mes?, origem?, destino?, valor? }
// Sem valor, transfere a sobra inteira do Estilo de Vida para a reserva.
export const rebalancePotsBalances = (dados = {}) => {
  const corpo = { ...dados };
  if (corpo.valor !== undefined && corpo.valor !== null && corpo.valor !== '') {
    corpo.valor = Number(String(corpo.valor).replace(',', '.'));
  }
  return request('/pots/rebalance', {
    method: 'POST',
    body: JSON.stringify(corpo),
  });
};

export const getLancamentosPotes = (mes, categoria) => {
  const params = [];
  if (mes) params.push(`mes=${encodeURIComponent(mes)}`);
  if (categoria) params.push(`categoria=${encodeURIComponent(categoria)}`);
  const query = params.join('&');
  return request(`/pots/lancamentos${query ? `?${query}` : ''}`);
};

export const criarLancamentoPote = (lancamento) =>
  request('/pots/lancamento', {
    method: 'POST',
    body: JSON.stringify(lancamento),
  });

export const deletarLancamentoPote = (id) =>
  request(`/pots/lancamento/${id}`, {
    method: 'DELETE',
  });

export const searchDeals = async (query = '', valorHora = 21.88) => {
  try {
    const res = await request(`/deals/search?q=${encodeURIComponent(query)}&valorHora=${valorHora}`);
    return Array.isArray(res) ? res : (res?.data || []);
  } catch (error) {
    return [];
  }
};

export const getFeaturedDeals = async (valorHora = 21.88) => {
  try {
    const res = await request(`/deals/featured?valorHora=${valorHora}`);
    return Array.isArray(res) ? res : (res?.data || []);
  } catch (error) {
    return [];
  }
};

export const getProductPriceHistory = async (produtoId, periodo = 90, valorHora = 21.88) => {
  try {
    const res = await request(`/deals/${produtoId}/history?periodo=${periodo}&valorHora=${valorHora}`);
    return res?.data || res;
  } catch (error) {
    const pDias = Number(periodo) || 90;
    const numPontos = pDias === 30 ? 5 : pDias === 60 ? 7 : 9;
    const precosMock = [4899, 4699, 4999, 4499, 4599, 4399, 4599, 4299, 4199].slice(0, numPontos);
    return {
      produtoId,
      produtoNome: 'Produto em Monitoramento',
      periodoDias: pDias,
      precoAtual: 4199.00,
      menorPrecoPeriodo: 4199.00,
      maiorPrecoPeriodo: 4999.00,
      precoMedioPeriodo: 4543.00,
      variacaoVersusPico: 16.0,
      diferencaReaisPico: 800.00,
      horasPoupadasVersusPico: Number((800 / valorHora).toFixed(1)),
      statusOportunidade: 'Menor Preco em ' + pDias + ' dias',
      corBadge: '#10b981',
      explicacao: 'Excelente oportunidade: o preco atual esta no menor patamar registrado no periodo.',
      pontosGrafico: precosMock.map((preco, idx) => ({
        indice: idx,
        dataRotulo: idx === numPontos - 1 ? 'Hoje' : (idx * Math.floor(pDias / numPontos) + 'd atras'),
        diasAtras: (numPontos - 1 - idx) * 10,
        preco,
        horasSuor: Number((preco / valorHora).toFixed(1)),
        isAtual: idx === numPontos - 1
      }))
    };
  }
};

export const createPriceAlert = async (produtoId, precoAlvo, valorHora = 21.88) => {
  try {
    const res = await request('/deals/alerts', {
      method: 'POST',
      body: JSON.stringify({ produtoId, precoAlvo, valorHora })
    });
    return res?.data || res;
  } catch (error) {
    return {
      id: 'alerta-' + Date.now(),
      produtoId,
      precoAlvo: Number(precoAlvo),
      atingido: false
    };
  }
};

export const getPriceAlerts = async () => {
  try {
    const res = await request('/deals/alerts');
    return Array.isArray(res) ? res : (res?.data || []);
  } catch (error) {
    return [
      {
        id: 'alerta-1',
        produtoId: 'iphone-15',
        produtoNome: 'Apple iPhone 15 (128 GB) - Preto',
        precoAtual: 4199.00,
        precoAlvo: 3999.00,
        economiaEsperada: 200.00,
        horasPoupadasEsperadas: 9.1,
        atingido: false
      }
    ];
  }
};

export const deletePriceAlert = async (id) => {
  try {
    return await request(`/deals/alerts/${id}`, { method: 'DELETE' });
  } catch (error) {
    return { success: true };
  }
};

export const getConsolidatedSavingsReport = async (valorHora = 21.88) => {
  try {
    const res = await request(`/deals/audit/summary?valorHora=${valorHora}`);
    if (res && res.data) return res.data;
    return res;
  } catch (error) {
    return {
      periodo: 'Acumulado Geral',
      dataGeracao: new Date().toISOString(),
      totais: {
        totalDinheiroPoupado: 6566.60,
        totalHorasPoupadas: 300.2,
        diasUteisPoupados: 37.5,
        mesesSalarioEquivalente: 1.88,
        nivelMaturidade: 'Mestre da Liberdade Financeira',
        valorHoraReferencia: Number(valorHora) || 21.88
      },
      distribuicaoPorOrigem: [
        {
          categoria: 'Cooldown e Quarentena',
          descricao: 'Compras impulsivas evitadas na quarentena reflexiva',
          valor: 4199.00,
          horas: 191.9,
          porcentagem: 64,
          itensContagem: 2
        },
        {
          categoria: 'Detox de Assinaturas',
          descricao: 'Economia projetada em 12 meses de mensalidades canceladas',
          valor: 717.60,
          horas: 32.8,
          porcentagem: 11,
          itensContagem: 2
        },
        {
          categoria: 'Radar e Comparador',
          descricao: 'Diferenca aproveitada entre o preco medio e a melhor oferta a vista',
          valor: 1650.00,
          horas: 75.5,
          porcentagem: 25,
          itensContagem: 13
        }
      ],
      projecaoRendimentoRendaFixa: {
        taxaReferenciaAnual: '10.75% a.a. (100% CDI / Tesouro Selic)',
        projecao1Ano: {
          rendimentoEstimado: 705.91,
          montanteFinal: 7272.51
        },
        projecao3Anos: {
          rendimentoEstimado: 2351.45,
          montanteFinal: 8918.05
        },
        projecao5Anos: {
          rendimentoEstimado: 4374.88,
          montanteFinal: 10941.48
        }
      },
      diagnosticoImpacto: {
        horasPreservadasTexto: '300.2 horas de vida poupadas',
        diasTrabalhoEvitadosTexto: '37.5 dias uteis de trabalho que voce nao precisou vender',
        impactoPatrimonial: 'Equivale a 1.88 meses do seu salario integral liquido preservado em conta.'
      }
    };
  }
};

export const exportSavingsStatement = async (formato = 'csv', valorHora = 21.88) => {
  try {
    const res = await request(`/deals/audit/export?formato=${formato}&valorHora=${valorHora}`);
    return res;
  } catch (error) {
    if (formato === 'csv') {
      return 'RELATORIO CONSOLIDADO DE IMPACTO - SAVE YOUR TIME\nTotal Dinheiro Poupado (R$);6566.60\nTotal Horas de Vida Poupadas;300.2h\nDias Uteis Preservados;37.5 dias';
    }
    return { success: true };
  }
};

export const ApiService = {
  getUserProfile: fetchPerfil,

  updateUserProfile: async (data) => {
    try {
      const res = await updatePerfil(
        data.salario,
        data.horasMensais,
        data.nome,
        data.metaEconomia
      );
      return { success: true, data: res, message: 'Perfil atualizado com sucesso.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getSubscriptions: async () => {
    return getAssinaturas();
  },

  getCooldownItems: async () => {
    return getCooldown();
  },

  createCooldownItem: async (desejo) => {
    return criarDesejoCooldown(desejo);
  },

  answerCooldownQuiz: async (id, respostas) => {
    return responderQuizCooldown(id, respostas);
  },

  giveUpCooldownItem: async (id) => {
    return desistirDesejoCooldown(id);
  },

  buyCooldownItem: async (id) => {
    return comprarDesejoCooldown(id);
  },

  getCooldownAudit: async () => {
    return getAuditoriaCooldown();
  },

  createExtendedCooldown: async (dados) => {
    return createExtendedCooldown(dados);
  },

  getDisciplineStreak: async () => {
    return getDisciplineStreak();
  },

  triggerCooldownPanicMode: async (dados) => {
    return triggerCooldownPanicMode(dados);
  },

  getCooldownTriggersAnalytics: async () => {
    return getCooldownTriggersAnalytics();
  },

  // Sprint 4 - Detox: aceita um objeto com os campos novos (valorCobrado, ciclo,
  // data de cobrança, divisão, teste grátis). A forma antiga
  // (nome, valorMensal, categoria, tipo) continua valendo.
  createSubscription: async (nomeOuDados, valorMensal, categoria, tipo) => {
    const dados =
      typeof nomeOuDados === 'object' && nomeOuDados !== null
        ? nomeOuDados
        : { nome: nomeOuDados, valorMensal, categoria, tipo };
    return request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },

  // Sprint 3 - Detox: custo por uso. Sprint 4: aceita também { resposta }, nos
  // tipos que têm uma pergunta em vez de usos para contar
  checkSubscriptionUsage: async (id, entrada) => {
    const corpo = typeof entrada === 'object' && entrada !== null ? entrada : { frequenciaUso: entrada };
    return request(`/subscriptions/${id}/usage-check`, {
      method: 'POST',
      body: JSON.stringify(corpo),
    });
  },

  // Sprint 4 - Detox: a tela inteira numa chamada (substitui insights, auditoria e
  // redundâncias separados) e a taxonomia. Status, edição e exclusão devolvem
  // { assinatura, resumo }, com o resumo já recalculado.
  getSubscriptionOverview: async () => {
    return request('/subscriptions/overview');
  },

  getSubscriptionMeta: async () => {
    return request('/subscriptions/meta');
  },

  changeSubscriptionStatus: async (id, dados) => {
    return request(`/subscriptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dados),
    });
  },

  updateSubscription: async (id, dados) => {
    return request(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dados),
    });
  },

  deleteSubscription: async (id) => {
    return request(`/subscriptions/${id}`, {
      method: 'DELETE',
    });
  },

  // Sprint 4 - Detox: catálogo (autocomplete), Detox do mês, guia de cancelamento
  // e meta de gasto com assinaturas
  searchSubscriptionCatalog: async (busca) => {
    return request(`/subscriptions/catalog?q=${encodeURIComponent(busca)}`);
  },

  getSubscriptionReview: async () => {
    return request('/subscriptions/review');
  },

  getSubscriptionCancelGuide: async (id) => {
    return request(`/subscriptions/${id}/cancel-guide`);
  },

  updateSubscriptionSettings: async (dados) => {
    return request('/subscriptions/settings', {
      method: 'PATCH',
      body: JSON.stringify(dados),
    });
  },

  searchDeals: async (query, valorHora) => {
    return searchDeals(query, valorHora);
  },  getFeaturedDeals: async (valorHora) => {
    return getFeaturedDeals(valorHora);
  },
  simularHorasSuor: async (item, preco, categoria, valorHora) => {
    return simularHorasSuor(item, preco, categoria, valorHora);
  },
  getSimulationHistory: async () => {
    return getSimulationHistory();
  },
  deleteSimulation: async (id) => {
    return deleteSimulation(id);
  },
  updateSimulationStatus: async (id, status) => {
    return updateSimulationStatus(id, status);
  },
  getHealthScore: async () => {
    return getHealthScore();
  },
  getHealthScoreTimeline: async () => {
    return getHealthScoreTimeline();
  },
  getUserBadges: async () => {
    return getUserBadges();
  },
  createFinancialGoal: async (meta) => {
    return createFinancialGoal(meta);
  },
  getFinancialGoals: async (valorHora) => {
    return getFinancialGoals(valorHora);
  },
  depositToFinancialGoal: async (id, valor) => {
    return depositToFinancialGoal(id, valor);
  },
  simulateGoalSavingImpact: async (valorPoupado, valorHora) => {
    return simulateGoalSavingImpact(valorPoupado, valorHora);
  },
  getPots: async (mes) => getPotes(mes),
  checkPurchaseBudgetImpact: async (valor, categoria) => checkPurchaseBudgetImpact(valor, categoria),
  getPotTransactions: async (mes, categoria) => getLancamentosPotes(mes, categoria),
  createPotTransaction: async (lancamento) => criarLancamentoPote(lancamento),
  deletePotTransaction: async (id) => deletarLancamentoPote(id),
  closeMonthlyPots: async (mes) => closeMonthlyPots(mes),
  getMonthlyCloseHistory: async () => getMonthlyCloseHistory(),
  rebalancePotsBalances: async (dados) => rebalancePotsBalances(dados),
  getProductPriceHistory: async (produtoId, periodo, valorHora) => {
    return getProductPriceHistory(produtoId, periodo, valorHora);
  },
  createPriceAlert: async (produtoId, precoAlvo, valorHora) => {
    return createPriceAlert(produtoId, precoAlvo, valorHora);
  },
  getPriceAlerts: async () => {
    return getPriceAlerts();
  },
  deletePriceAlert: async (id) => {
    return deletePriceAlert(id);
  },
  getConsolidatedSavingsReport: async (valorHora) => {
    return getConsolidatedSavingsReport(valorHora);
  },
  exportSavingsStatement: async (formato, valorHora) => {
    return exportSavingsStatement(formato, valorHora);
  },
};