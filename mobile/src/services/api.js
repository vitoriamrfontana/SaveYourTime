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
export const getPotes = (mes) => request(`/pots${mes ? `?mes=${encodeURIComponent(mes)}` : ''}`);

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

  toggleSubscription: async (id) => {
    return request(`/subscriptions/${id}/toggle`, {
      method: 'PATCH',
    });
  },

    createSubscription: async (nome, valorMensal, categoria) => {
    return request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ nome, valorMensal, categoria }),
    });
  },

  getSubscriptionInsights: async () => {
    return request('/subscriptions/insights');
  },

  getSubscriptionAudit: async () => {
    return request('/subscriptions/auditoria');
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
  getPots: async (mes) => getPotes(mes),
  getPotTransactions: async (mes, categoria) => getLancamentosPotes(mes, categoria),
  createPotTransaction: async (lancamento) => criarLancamentoPote(lancamento),
  deletePotTransaction: async (id) => deletarLancamentoPote(id),
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
};