const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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

  // Parte da API usa o envelope { success, data }, enquanto endpoints
  // simples (como /pots e /cooldown) retornam o payload diretamente.
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

export const simularHorasSuor = async (item, preco, valorHoraActual) => {
  const precoNum = Number(preco);
  const vHora = Number(valorHoraActual) || 21.88;

  try {
    const data = await request('/simulate', {
      method: 'POST',
      body: JSON.stringify({ precoItem: precoNum }),
    });

    const horasSuor = Number(data.horasSuor ?? (precoNum / vHora).toFixed(1));
    const diasTrabalho = Number(data.diasTrabalho ?? (horasSuor / 8).toFixed(1));
    const salarioMensal = vHora * 160;
    const percentualSalario = Number(((precoNum / salarioMensal) * 100).toFixed(1));

    return {
      ...data,
      simulacao: {
        item,
        preco: precoNum,
        horasSuor,
        diasTrabalho,
        percentualSalario,
      },
    };
  } catch (error) {
    const horasSuor = Number((precoNum / vHora).toFixed(1));
    const diasTrabalho = Number((horasSuor / 8).toFixed(1));
    const salarioMensal = vHora * 160;
    const percentualSalario = Number(((precoNum / salarioMensal) * 100).toFixed(1));

    return {
      simulacao: {
        item,
        preco: precoNum,
        horasSuor,
        diasTrabalho,
        percentualSalario,
      },
      mensagem: `O item "${item}" (R$ ${precoNum.toFixed(2)}) custará ${horasSuor} horas (${diasTrabalho} dias úteis) do seu trabalho.`,
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
};
