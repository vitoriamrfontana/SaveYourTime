/**
 * MODEL - Detox de Assinaturas
 
 */

let subscriptions = [
  { id: 1, nome: "Streaming de Filmes", valorMensal: 39.9, ativo: true },
  { id: 2, nome: "Streaming de Música", valorMensal: 21.9, ativo: true },
  { id: 3, nome: "Academia Online", valorMensal: 49.9, ativo: false },
  { id: 4, nome: "Tarifa de Manutenção da Conta", valorMensal: 19.9, ativo: true },
  { id: 5, nome: "Seguro Celular", valorMensal: 24.9, ativo: true },
  { id: 6, nome: "Aplicativo de Nuvem (Storage)", valorMensal: 9.9, ativo: false },
];

function getSubscriptions() {
  return subscriptions;
}

function getEconomiaTotal() {
  // Soma o valor mensal de tudo que já foi marcado como cancelado (ativo: false)
  const economiaMensal = subscriptions
    .filter((s) => !s.ativo)
    .reduce((total, s) => total + s.valorMensal, 0);

  return {
    economiaMensal: Number(economiaMensal.toFixed(2)),
    economiaAnual: Number((economiaMensal * 12).toFixed(2)),
  };
}

function addSubscription({ nome, valorMensal }) {
  const novaAssinatura = {
    id: subscriptions.length > 0 ? Math.max(...subscriptions.map((s) => s.id)) + 1 : 1,
    nome,
    valorMensal: Number(valorMensal),
    ativo: true,
  };
  subscriptions.push(novaAssinatura);
  return novaAssinatura;
}

function toggleSubscription(id) {
  const assinatura = subscriptions.find((s) => s.id === Number(id));
  if (!assinatura) return null;

  assinatura.ativo = !assinatura.ativo;
  return assinatura;
}

module.exports = {
  getSubscriptions,
  getEconomiaTotal,
  addSubscription,
  toggleSubscription,
};