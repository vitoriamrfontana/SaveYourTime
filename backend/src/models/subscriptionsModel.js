/**
 * MODEL - Detox de Assinaturas
 *
 * Sprint 1: lista, cadastro, cancelar/reativar e economia.
 * Sprint 2: categorias, auditoria, custo invisível, juros compostos e horas de trabalho.
 * Sprint 3: detector de assinaturas zumbis (concorrentes) e custo por uso.
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

// Tipo = a função do serviço. Duas assinaturas ativas do MESMO tipo (e, portanto,
// da mesma categoria) são concorrentes. Comparar só a categoria daria falso alarme:
// "Tarifa da conta" e "Seguro celular" são ambas "financeiro", mas não competem.
const TIPOS_POR_CATEGORIA = {
  streaming: ["video", "musica"],
  saude: ["academia", "plano_saude"],
  financeiro: ["conta_bancaria", "seguro", "cartao"],
  software: ["nuvem", "produtividade", "jogos"],
  outros: [],
};

// Custo por uso: limites (R$ por uso) para classificar o custo-benefício.
// Ex.: R$ 90/mês usado 3 vezes = R$ 30 por uso -> "prejuizo".
const LIMITE_CUSTO_EXCELENTE = 5;
const LIMITE_CUSTO_NEUTRO = 15;

const SEED_INICIAL = [
  { id: 1, nome: "Streaming de Filmes", valorMensal: 39.9, ativo: true, categoria: "streaming", tipo: "video" },
  { id: 2, nome: "Streaming de Música", valorMensal: 21.9, ativo: true, categoria: "streaming", tipo: "musica" },
  { id: 3, nome: "Academia Online", valorMensal: 49.9, ativo: false, categoria: "saude", tipo: "academia" },
  { id: 4, nome: "Tarifa de Manutenção da Conta", valorMensal: 19.9, ativo: true, categoria: "financeiro", tipo: "conta_bancaria" },
  { id: 5, nome: "Seguro Celular", valorMensal: 24.9, ativo: true, categoria: "financeiro", tipo: "seguro" },
  { id: 6, nome: "Aplicativo de Nuvem (Storage)", valorMensal: 9.9, ativo: false, categoria: "software", tipo: "nuvem" },
  // Sprint 3: concorre com o id 1 (dois streamings de vídeo ativos) para o alerta aparecer na demo
  { id: 7, nome: "Streaming de Séries", valorMensal: 34.9, ativo: true, categoria: "streaming", tipo: "video" },
];

let subscriptions = [];
let auditoria = [];


function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

function categoriaValida(categoria) {
  return CATEGORIAS.includes(categoria) ? categoria : CATEGORIA_PADRAO;
}

// O tipo só vale se pertencer à categoria; senão fica null (e nunca gera alerta)
function tipoValido(tipo, categoria) {
  const tipos = TIPOS_POR_CATEGORIA[categoria] || [];
  return tipos.includes(tipo) ? tipo : null;
}

function normalizar(s) {
  const categoria = categoriaValida(s.categoria);
  return {
    id: s.id,
    nome: String(s.nome).trim(),
    valorMensal: Number(s.valorMensal),
    ativo: Boolean(s.ativo),
    categoria,
    tipo: tipoValido(s.tipo, categoria),
    canceladaEm: s.canceladaEm ?? null,
    usoMensal: s.usoMensal ?? null,
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



// Cópia "funda" o suficiente para o objeto usoMensal também não vazar por referência
function copiar(s) {
  return { ...s, usoMensal: s.usoMensal ? { ...s.usoMensal } : null };
}

function getSubscriptions() {
  return subscriptions.map(copiar);
}

function getEconomiaTotal() {
  // Soma o valor mensal de tudo que já foi marcado como cancelado (ativo: false)
  const economiaMensal = somarValorMensal(subscriptions.filter((s) => !s.ativo));

  return {
    economiaMensal: arredondar(economiaMensal),
    economiaAnual: arredondar(economiaMensal * 12),
  };
}

function addSubscription({ nome, valorMensal, categoria, tipo }) {
  const novaAssinatura = normalizar({
    id: subscriptions.length > 0 ? Math.max(...subscriptions.map((s) => s.id)) + 1 : 1,
    nome,
    valorMensal,
    ativo: true,
    categoria,
    tipo,
  });
  subscriptions.push(novaAssinatura);
  return copiar(novaAssinatura);
}

function toggleSubscription(id) {
  const assinatura = subscriptions.find((s) => s.id === Number(id));
  if (!assinatura) return null;

  assinatura.ativo = !assinatura.ativo;
  assinatura.canceladaEm = assinatura.ativo ? null : new Date().toISOString();
  registrarAuditoria(assinatura);

  return copiar(assinatura);
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

// ---------------------------------------------------------------------------
// Sprint 3 - Custo por uso
// ---------------------------------------------------------------------------

function classificarCustoPorUso(custoPorUso) {
  if (custoPorUso === null) return "prejuizo"; // pagou e não usou nenhuma vez
  if (custoPorUso <= LIMITE_CUSTO_EXCELENTE) return "excelente";
  if (custoPorUso <= LIMITE_CUSTO_NEUTRO) return "neutro";
  return "prejuizo";
}

// Calcula quanto custa cada uso no mês e guarda o resultado na assinatura,
// para a lista e o detector de zumbis poderem usar depois.
// Retorna null se o id não existir.
function calcularCustoUso(id, frequenciaUso) {
  const assinatura = subscriptions.find((s) => s.id === Number(id));
  if (!assinatura) return null;

  const usos = Number(frequenciaUso);
  const custoPorUso = usos > 0 ? arredondar(assinatura.valorMensal / usos) : null;

  assinatura.usoMensal = {
    frequenciaUso: usos,
    custoPorUso,
    classificacao: classificarCustoPorUso(custoPorUso),
    verificadoEm: new Date().toISOString(),
  };

  return {
    id: assinatura.id,
    nome: assinatura.nome,
    valorMensal: assinatura.valorMensal,
    ...assinatura.usoMensal,
  };
}

// ---------------------------------------------------------------------------
// Sprint 3 - Detector de assinaturas zumbis (concorrentes)
// ---------------------------------------------------------------------------

// Ordem de "pior para manter": quem foi verificado como prejuízo vem primeiro,
// depois quem nunca foi verificado, e por último neutro/excelente.
const PESO_CLASSIFICACAO = { prejuizo: 0, sem_verificacao: 1, neutro: 2, excelente: 3 };

function pesoParaManter(s) {
  return PESO_CLASSIFICACAO[s.usoMensal?.classificacao ?? "sem_verificacao"];
}

// Sugere pausar UMA assinatura do grupo: a de pior custo-benefício;
// empatando, a mais cara. O usuário continua com as outras.
function escolherSugestaoPausa(grupo) {
  const ordenado = [...grupo].sort(
    (a, b) => pesoParaManter(a) - pesoParaManter(b) || b.valorMensal - a.valorMensal
  );
  const escolhida = ordenado[0];

  let motivo = "É a mais cara entre serviços que fazem a mesma coisa.";
  if (escolhida.usoMensal?.frequenciaUso === 0) {
    motivo = "Você não usou nenhuma vez no último mês.";
  } else if (escolhida.usoMensal?.classificacao === "prejuizo") {
    motivo = `Custo por uso alto: R$ ${escolhida.usoMensal.custoPorUso.toFixed(2).replace(".", ",")} a cada vez que você usa.`;
  }

  return {
    id: escolhida.id,
    nome: escolhida.nome,
    economiaMensal: arredondar(escolhida.valorMensal),
    economiaAnual: arredondar(escolhida.valorMensal * 12),
    motivo,
  };
}

function detectarRedundancias() {
  const porTipo = {};
  getAtivas()
    .filter((s) => s.tipo)
    .forEach((s) => {
      porTipo[s.tipo] = porTipo[s.tipo] || [];
      porTipo[s.tipo].push(s);
    });

  const grupos = Object.entries(porTipo)
    .filter(([, lista]) => lista.length >= 2)
    .map(([tipo, lista]) => ({
      tipo,
      categoria: lista[0].categoria,
      quantidade: lista.length,
      gastoMensal: arredondar(somarValorMensal(lista)),
      assinaturas: lista.map(copiar),
      sugestaoPausa: escolherSugestaoPausa(lista),
    }))
    .sort((a, b) => b.gastoMensal - a.gastoMensal);

  const economiaPotencialMensal = arredondar(
    grupos.reduce((total, g) => total + g.sugestaoPausa.economiaMensal, 0)
  );

  return {
    totalGrupos: grupos.length,
    economiaPotencialMensal,
    economiaPotencialAnual: arredondar(economiaPotencialMensal * 12),
    grupos,
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
  calcularCustoUso,
  detectarRedundancias,
  CATEGORIAS,
  TIPOS_POR_CATEGORIA,
  TAXA_ANUAL_CDI,
  PERIODOS_MESES,
  // Apenas para testes
  _resetForTests: inicializar,
};