const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    '[api.js] EXPO_PUBLIC_API_URL não definida. Confira o .env na pasta mobile/.'
  );
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.erro || `Erro ${res.status} ao acessar ${path}`);
  }

  return res.json();
}

export const getHealth = () => request('/health');
export const getPerfil = () => request('/user');
export const updatePerfil = (salario, horasMensais) =>
  request('/user', { method: 'PUT', body: JSON.stringify({ salario, horasMensais }) });
export const simularHorasSuor = (precoItem) =>
  request('/simulate', { method: 'POST', body: JSON.stringify({ precoItem }) });
export const getAssinaturas = () => request('/subscriptions');
export const getCooldown = () => request('/cooldown');
export const getPotes = () => request('/pots');