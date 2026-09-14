// Serviço de Conexão com o Backend com fallback para ambiente offline/demonstração
const API_BASE = 'http://localhost:3000/api';

export const fetchPerfil = async () => {
  try {
    const res = await fetch(`${API_BASE}/user`);
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback local
  }
  return { nome: 'Maria Silva', salario: 3500, horasMensais: 160, valorHora: 21.88 };
};

export const updatePerfil = async (salario, horasMensais) => {
  try {
    const res = await fetch(`${API_BASE}/user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salario, horasMensais })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const valorHora = parseFloat((salario / horasMensais).toFixed(2));
  return { nome: 'Maria Silva', salario: Number(salario), horasMensais: Number(horasMensais), valorHora };
};

export const simularHorasSuor = async (item, preco, valorHoraActual) => {
  try {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, preco })
    });
    if (res.ok) return await res.json();
  } catch (e) {}

  const precoNum = parseFloat(preco);
  const vHora = valorHoraActual || 21.88;
  const salarioMensal = vHora * 160;

  const horasSuor = parseFloat((precoNum / vHora).toFixed(1));
  const diasTrabalho = parseFloat((horasSuor / 8).toFixed(1));
  const percentualSalario = parseFloat(((precoNum / salarioMensal) * 100).toFixed(1));

  return {
    simulacao: { item, preco: precoNum, horasSuor, diasTrabalho, percentualSalario },
    mensagem: `O item "${item}" (R$ ${precoNum.toFixed(2)}) custará ${horasSuor} horas (${diasTrabalho} dias úteis) do seu trabalho.`
  };
};

export const fetchPotes = async (salarioActual) => {
  try {
    const res = await fetch(`${API_BASE}/pots`);
    if (res.ok) return await res.json();
  } catch (e) {}

  const salario = salarioActual || 3500;
  return {
    salario,
    potes: {
      sobrevivencia: { nome: 'Sobrevivência (50%)', gasto: 1650, limite: salario * 0.5, porcentagem: 94, estourou: false },
      estiloVida: { nome: 'Estilo de Vida (30%)', gasto: 1150, limite: salario * 0.3, porcentagem: 109, estourou: true },
      dividas: { nome: 'Quitação / Dívidas (20%)', gasto: 500, limite: salario * 0.2, porcentagem: 71, estourou: false }
    }
  };
};

export const ApiService = {
  getUserProfile: fetchPerfil,
  updateUserProfile: async (data) => {
    const res = await updatePerfil(data.salario, data.horasMensais);
    return { success: true, data: res, message: 'Perfil atualizado com sucesso.' };
  },

  // Listar assinaturas + economia acumulada
  getSubscriptions: async () => {
    const response = await fetch(`${API_BASE}/subscriptions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json?.error?.message || 'Erro ao buscar assinaturas.');
    }
    return json.data; // { subscriptions, economia }
  },

  // Alternar status ativo/cancelado de uma assinatura
  toggleSubscription: async (id) => {
    const response = await fetch(`${API_BASE}/subscriptions/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json?.error?.message || 'Erro ao atualizar assinatura.');
    }
    return json.data;
  },

  // Cadastrar nova assinatura
  createSubscription: async (nome, valorMensal) => {
    const response = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, valorMensal })
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json?.error?.message || 'Erro ao criar assinatura.');
    }
    return json.data;
  }
};