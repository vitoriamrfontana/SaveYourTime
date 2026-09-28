/**
 * MODEL - Detox de Assinaturas
 *
 * 
 */

// Taxa anual de referência (100% do CDI).
// Atualizar quando o Copom mudar a Selic. Referência: CDI ~13,90% a.a. (ago/2026)
const TAXA_ANUAL_CDI = 0.139;

// Períodos usados no custo invisível e na projeção de juros (em meses)
const PERIODOS_MESES = [12, 36, 60];

// De quantos em quantos meses a curva do gráfico gera um ponto
const INTERVALO_CURVA_MESES = 6;

const CATEGORIAS = ["streaming", "saude", "financeiro", "software", "outros"];
const CATEGORIA_PADRAO = "outros";

const SEED_INICIAL = [
  { id: 1, nome: "Streaming de Filmes", valorMensal: 39.9, ativo: true, categoria: "streaming" },
  { id: 2, nome: "Streaming de Música", valorMensal: 21.9, ativo: true, categoria: "streaming" },
  { id: 3, nome: "Academia Online", valorMensal: 49.9, ativo: false, categoria: "saude" },
  { id: 4, nome: "Tarifa de Manutenção da Conta", valorMensal: 19.9, ativo: true, categoria: "financeiro" },
  { id: 5, nome: "Seguro Celular", valorMensal: 24.9, ativo: true, categoria: "financeiro" },
  { id: 6, nome: "Aplicativo de Nuvem (Storage)", valorMensal: 9.9, ativo: false, categoria: "software" },
];

let subscriptions = [];
let auditoria = [];


function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

function categoriaValida(categoria) {
  return CATEGORIAS.includes(categoria) ? categoria : CATEGORIA_PADRAO;
}

function normalizar(s) {
  return {
    id: s.id,
    nome: s.nome,
    valorMensal: Number(s.valorMensal),
    ativo: Boolean(s.ativo),
    categoria: categoriaValida(s.categoria),
    canceladaEm: s.canceladaEm ?? null,
  };
}

function inicializar(seed = SEED_INICIAL) {
  subscriptions = seed.map(normalizar);
  auditoria = [];
}

function somarValorMensal(lista) {
  return lista.reduce((total, s) => total + s.valorMensal, 0);
}

function getAtivas() {
  return subscriptions.filter((s) => s.ativo);
}

function registrarAuditoria(assinatura) {
  auditoria.push({
    id: auditoria.length + 1,
    assinaturaId: assinatura.id,
    nome: assinatura.nome,
    valorMensal: assinatura.valorMensal,
    acao: assinatura.ativo ? "reativada" : "cancelada",
    data: new Date().toISOString(),
  });
}

// Converte taxa anual em taxa mensal equivalente: (1 + a)^(1/12) - 1
function taxaMensalEquivalente(taxaAnual) {
  return Math.pow(1 + taxaAnual, 1 / 12) - 1;
}

// Valor futuro de aportes mensais iguais: P * ((1 + i)^n - 1) / i
function montanteComAportes(aporteMensal, meses, taxaMensal) {
  if (taxaMensal === 0) return aporteMensal * meses;
  return aporteMensal * ((Math.pow(1 + taxaMensal, meses) - 1) / taxaMensal);
}



function getSubscriptions() {
  return subscriptions.map((s) => ({ ...s }));
}

function getEconomiaTotal() {
  // Soma o valor mensal de tudo que já foi marcado como cancelado (ativo: false)
  const economiaMensal = somarValorMensal(subscriptions.filter((s) => !s.ativo));

  return {
    economiaMensal: arredondar(economiaMensal),
    economiaAnual: arredondar(economiaMensal * 12),
  };
}

function addSubscription({ nome, valorMensal, categoria }) {
  const novaAssinatura = {
    id: subscriptions.length > 0 ? Math.max(...subscriptions.map((s) => s.id)) + 1 : 1,
    nome,
    valorMensal: Number(valorMensal),
    ativo: true,
    categoria: categoriaValida(categoria),
    canceladaEm: null,
  };
  subscriptions.push(novaAssinatura);
  return { ...novaAssinatura };
}

function toggleSubscription(id) {
  const assinatura = subscriptions.find((s) => s.id === Number(id));
  if (!assinatura) return null;

  assinatura.ativo = !assinatura.ativo;
  assinatura.canceladaEm = assinatura.ativo ? null : new Date().toISOString();
  registrarAuditoria(assinatura);

  return { ...assinatura };
}

// Histórico de cancelamentos/reativações, do mais recente para o mais antigo
function getAuditoria() {
  return auditoria.map((e) => ({ ...e })).reverse();
}

// Custo Invisível: quanto cada assinatura ativa custa acumulada em 12, 36 e 60 meses
function calcularCustoInvisivel() {
  const ativas = getAtivas();
  const gastoMensal = somarValorMensal(ativas);

  const itens = ativas.map((s) => ({
    id: s.id,
    nome: s.nome,
    categoria: s.categoria,
    valorMensal: s.valorMensal,
    projecoes: PERIODOS_MESES.map((meses) => ({
      meses,
      valor: arredondar(s.valorMensal * meses),
    })),
  }));

  const totais = PERIODOS_MESES.map((meses) => ({
    meses,
    valor: arredondar(gastoMensal * meses),
  }));

  return { gastoMensal: arredondar(gastoMensal), itens, totais };
}

// Juros compostos: a economia das canceladas aplicada todo mês a 100% do CDI
function calcularProjecaoJuros(taxaAnual = TAXA_ANUAL_CDI) {
  const { economiaMensal } = getEconomiaTotal();
  const taxaMensal = taxaMensalEquivalente(taxaAnual);

  const calcularPonto = (meses) => {
    const totalAportado = economiaMensal * meses;
    const montante = montanteComAportes(economiaMensal, meses, taxaMensal);
    return {
      meses,
      totalAportado: arredondar(totalAportado),
      montante: arredondar(montante),
      rendimento: arredondar(montante - totalAportado),
    };
  };

  const mesesMaximo = Math.max(...PERIODOS_MESES);
  const curva = [];
  for (let meses = 0; meses <= mesesMaximo; meses += INTERVALO_CURVA_MESES) {
    curva.push(calcularPonto(meses));
  }

  return {
    economiaMensal,
    taxaAnualPercentual: arredondar(taxaAnual * 100),
    periodos: PERIODOS_MESES.map(calcularPonto),
    curva,
  };
}

// Horas de trabalho por mês necessárias só para pagar as assinaturas ativas.
// Recebe valorHora/horasMensais de fora (vêm do Perfil) para não acoplar os models.
function calcularHorasTrabalho({ valorHora, horasMensais } = {}) {
  const gastoMensal = arredondar(somarValorMensal(getAtivas()));
  const vh = Number(valorHora);
  const hm = Number(horasMensais);

  if (!vh || vh <= 0) {
    return { gastoMensal, valorHora: null, horasNecessarias: null, percentualDoMes: null };
  }

  const horasNecessarias = gastoMensal / vh;
  const percentualDoMes = hm > 0 ? arredondar((horasNecessarias / hm) * 100) : null;

  return {
    gastoMensal,
    valorHora: vh,
    horasNecessarias: arredondar(horasNecessarias),
    percentualDoMes,
  };
}

// Resumo enxuto para outros módulos (ex.: Health Score do Dashboard)
function getResumoDetox() {
  const ativas = getAtivas();
  return {
    totalAssinaturas: subscriptions.length,
    ativas: ativas.length,
    canceladas: subscriptions.length - ativas.length,
    gastoMensalAtivo: arredondar(somarValorMensal(ativas)),
    ...getEconomiaTotal(),
  };
}

inicializar();

module.exports = {
  getSubscriptions,
  getEconomiaTotal,
  addSubscription,
  toggleSubscription,
  getAuditoria,
  calcularCustoInvisivel,
  calcularProjecaoJuros,
  calcularHorasTrabalho,
  getResumoDetox,
  CATEGORIAS,
  TAXA_ANUAL_CDI,
  PERIODOS_MESES,
  // Apenas para testes
  _resetForTests: inicializar,
};