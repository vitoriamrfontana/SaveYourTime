const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.163:3000/api';

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn(
    '[api.js] EXPO_PUBLIC_API_URL não definida. Usando http://localhost:3000/api como fallback.'
  );
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
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
export const getPotes = () => request('/pots');

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

  toggleSubscription: async (id) => {
    return request(`/subscriptions/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  createSubscription: async (nome, valorMensal) => {
    return request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ nome, valorMensal }),
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
};