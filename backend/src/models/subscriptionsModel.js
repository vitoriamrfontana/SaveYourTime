/**
 * MODEL - Detox de Assinaturas
 *
 * Sprint 1: lista, cadastro, cancelar/reativar e economia.
 * Sprint 2: categorias, auditoria, custo invisível, juros compostos e horas de trabalho.
 * Sprint 3: detector de assinaturas zumbis (concorrentes) e custo por uso.
 * Sprint 4: economia real (só o que o usuário cancelou) e acumulada até hoje;
 * ciclos de cobrança, plano dividido e próximas cobranças; status de verdade
 * (ativa, teste grátis, pausada e cancelada); edição com histórico de preços e
 * exclusão. Contas de dinheiro e de datas ficam em utils/ e a taxonomia em
 * subscriptionsTaxonomia.js. Também na Sprint 4: custo por uso justo por tipo (com
 * validade e histórico), score de eficiência, limite de gasto pela renda, revisão
 * do mês, guia de cancelamento (catálogo em subscriptionsCatalog.js) e projeções
 * com IR regressivo, reajuste pelo IPCA e custo de oportunidade.
 */

const { arredondar, somar, multiplicar } = require("../utils/dinheiro");
const {
  paraDataLocal,
  hoje,
  ultimoDiaDoMes,
  adicionarMeses,
  adicionarDias,
  diasEntre,
  inicioDoDia,
} = require("../utils/datas");
const {
  CATEGORIAS,
  CATEGORIA_PADRAO,
  TIPOS_POR_CATEGORIA,
  ROTULOS_CATEGORIA,
  ROTULOS_TIPO,
  USO_POR_TIPO,
  PERGUNTA_POR_TIPO,
  EXPLICACAO_SEM_TIPO,
  CICLOS,
  CICLO_PADRAO,
  MESES_POR_CICLO,
  ROTULOS_CICLO,
  STATUS,
  ROTULOS_STATUS,
  CHECKLIST,
} = require("./subscriptionsTaxonomia");
const {
  PASSOS_PARA_CANCELAR,
  LOJAS_DE_APLICATIVOS,
  DIREITOS_DO_CONSUMIDOR,
  AVISO_JURIDICO,
  servicoPorId,
  encontrarNoCatalogo,
} = require("./subscriptionsCatalog");

// Taxas de reserva (100% do CDI e IPCA em 12 meses). Sprint 4: as atuais vêm do
// Banco Central pelo taxasService; estas valem quando ele não responde.
// Referência: CDI 13,65% a.a. (SGS 4389, 29/10/2026) e IPCA 4,58% (SGS 13522, set/2026)
const TAXA_ANUAL_CDI = 0.1365;
const IPCA_12M_REFERENCIA = 0.0458;
const DATA_TAXAS_REFERENCIA = "2026-10-29";

// Sprint 4: IR regressivo da renda fixa (Lei 11.033/2004, art. 1º, conferido em
// 01/11/2026 no planalto.gov.br). O prazo de cada aporte é contado em dias
// aproximados (meses x 365/12). O IOF fica de fora: só vale para resgate em menos de 30 dias.
const TABELA_IR = [
  { ateDias: 180, aliquota: 0.225 },
  { ateDias: 360, aliquota: 0.2 },
  { ateDias: 720, aliquota: 0.175 },
  { ateDias: Infinity, aliquota: 0.15 },
];
const DIAS_POR_MES = 365 / 12;

// Períodos usados no custo invisível e na projeção de juros (em meses)
const PERIODOS_MESES = [12, 36, 60];

// De quantos em quantos meses a curva do gráfico gera um ponto
const INTERVALO_CURVA_MESES = 6;

// Custo por uso: limites (R$ por uso) para classificar o custo-benefício.
// Ex.: R$ 90/mês usado 3 vezes = R$ 30 por uso -> "prejuizo".
const LIMITE_CUSTO_EXCELENTE = 5;
const LIMITE_CUSTO_NEUTRO = 15;

// Sprint 4: limites do cadastro (o middleware e o formulário do app usam os mesmos)
const VALOR_MENSAL_MAXIMO = 10000;
const NOME_MAXIMO = 60;
const COMPARTILHADA_COM_MAXIMO = 20;

// Sprint 4: uma verificação de uso vale 30 dias; depois, a tela pede para reavaliar
const VALIDADE_VERIFICACAO_DIAS = 30;
const HISTORICO_USO_MAXIMO = 12;

// Sprint 4: meta de gasto com assinaturas, em % da renda (a pessoa ajusta)
const LIMITE_PERCENTUAL_RENDA_PADRAO = 5;
const LIMITE_PERCENTUAL_RENDA_MAXIMO = 50;

// Sprint 4: score de eficiência (0 a 100). Começa em 100 e perde pontos por
// custo-benefício ruim, falta de verificação recente, concorrência e peso na renda.
const PENALIDADE_CUSTO_BENEFICIO = { excelente: 0, neutro: 15, prejuizo: 40 };
const PENALIDADE_SEM_VERIFICACAO = 10;
const PENALIDADE_CONCORRENTE = 20;
const PENALIDADE_POR_PONTO_DA_RENDA = 8;
const PENALIDADE_RENDA_MAXIMA = 20;
const SCORE_BOM = 70;
const SCORE_ATENCAO = 40;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Sprint 4: "ativo" (o booleano antigo) vale para quem ainda tem a assinatura.
// Pausada e cancelada são os status em que ela deixa de ser cobrada.
const STATUS_ASSINADOS = ["ativa", "teste"];
const STATUS_SEM_COBRANCA = ["pausada", "cancelada"];

// Como cada status entra numa frase ("já está pausada")
const STATUS_NA_FRASE = {
  ativa: "ativa",
  teste: "em teste grátis",
  pausada: "pausada",
  cancelada: "cancelada",
};

// Sprint 4: campos só do seed, trocados por datas a partir de "agora" em seedPadrao():
// canceladaHaDias (inativas que o usuário cancelou antes de a demo começar),
// cobrancaEmDias (próxima cobrança) e fimTesteEmDias (fim do teste grátis).
const SEED_INICIAL = [
  { id: 1, nome: "Streaming de Filmes", valorMensal: 39.9, ativo: true, categoria: "streaming", tipo: "video", cobrancaEmDias: 3 },
  { id: 2, nome: "Streaming de Música", valorMensal: 21.9, ativo: true, categoria: "streaming", tipo: "musica", cobrancaEmDias: 12 },
  { id: 3, nome: "Academia Online", valorMensal: 49.9, ativo: false, categoria: "saude", tipo: "academia", canceladaHaDias: 75 },
  { id: 4, nome: "Tarifa de Manutenção da Conta", valorMensal: 19.9, ativo: true, categoria: "financeiro", tipo: "conta_bancaria", cobrancaEmDias: 6 },
  { id: 5, nome: "Seguro Celular", valorMensal: 24.9, ativo: true, categoria: "financeiro", tipo: "seguro", cobrancaEmDias: 20 },
  { id: 6, nome: "Aplicativo de Nuvem (Storage)", valorMensal: 9.9, ativo: false, categoria: "software", tipo: "nuvem", canceladaHaDias: 130 },
  // Sprint 3: concorre com o id 1 (dois streamings de vídeo ativos) para o alerta aparecer na demo
  { id: 7, nome: "Streaming de Séries", valorMensal: 34.9, ativo: true, categoria: "streaming", tipo: "video", cobrancaEmDias: 1 },
  // Sprint 4: teste grátis acabando, para o card de próximas cobranças aparecer na demo
  { id: 8, nome: "Aplicativo de Idiomas", valorCobrado: 34.9, status: "teste", categoria: "outros", tipo: "educacao", fimTesteEmDias: 5 },
];

let subscriptions = [];
let auditoria = [];
let configuracoes = { limitePercentualRenda: LIMITE_PERCENTUAL_RENDA_PADRAO };
// Sprint 4: contador próprio, para o id de uma assinatura removida não ser
// reaproveitado (a auditoria guarda o id e passaria a apontar para outra)
let proximoIdLivre = 1;

function categoriaValida(categoria) {
  return CATEGORIAS.includes(categoria) ? categoria : CATEGORIA_PADRAO;
}

// Sprint 4: categoria a que o tipo pertence ("video" -> "streaming"); undefined se o tipo não existe
function categoriaDoTipo(tipo) {
  return CATEGORIAS.find((categoria) => TIPOS_POR_CATEGORIA[categoria].includes(tipo));
}

// O tipo só vale se pertencer à categoria; senão fica null (e nunca gera alerta)
function tipoValido(tipo, categoria) {
  const tipos = TIPOS_POR_CATEGORIA[categoria] || [];
  return tipos.includes(tipo) ? tipo : null;
}

// Sprint 4: quanto a assinatura custa por mês para você: o valor de cada cobrança
// convertido para mês e dividido entre as pessoas que dividem o plano
function custoMensal(valorCobrado, ciclo, compartilhadaCom = 0) {
  const mesesPorCobranca = ciclo === "semanal" ? 12 / 52 : MESES_POR_CICLO[ciclo];
  return multiplicar(valorCobrado, 1 / mesesPorCobranca / (compartilhadaCom + 1));
}

// Sprint 4: a parte de uma cobrança que cabe a você
function suaParte(s) {
  return multiplicar(s.valorCobrado, 1 / (s.compartilhadaCom + 1));
}

// Sprint 4: o teto vale para o plano inteiro convertido para mês (antes de dividir)
function erroDoTeto(valorCobrado, ciclo) {
  if (custoMensal(valorCobrado, ciclo) <= VALOR_MENSAL_MAXIMO) return null;
  return `O valor equivale a mais de R$ ${VALOR_MENSAL_MAXIMO.toLocaleString("pt-BR")} por mês, acima do limite.`;
}

// Sprint 4: dados antigos só têm o booleano "ativo"
function statusInicial(s) {
  if (STATUS.includes(s.status)) return s.status;
  return s.ativo === false ? "cancelada" : "ativa";
}

// Sprint 4: períodos em que a assinatura ficou sem ser cobrada ("AAAA-MM-DD"), base
// da economia acumulada. Dados antigos só têm canceladaEm: viram um período aberto.
function periodosIniciais(periodos, status, canceladaEm) {
  if (Array.isArray(periodos)) return periodos.map((p) => ({ ...p }));
  return status === "cancelada" && canceladaEm ? [{ inicio: paraDataLocal(canceladaEm), fim: null }] : [];
}

function normalizar(s) {
  // Sprint 4: sem categoria, mas com um tipo conhecido, a categoria vem do tipo
  const categoria = categoriaValida(s.categoria ?? categoriaDoTipo(s.tipo));
  const status = statusInicial(s);
  const ciclo = CICLOS.includes(s.ciclo) ? s.ciclo : CICLO_PADRAO;
  const compartilhadaCom = Number.isInteger(s.compartilhadaCom) && s.compartilhadaCom > 0 ? s.compartilhadaCom : 0;
  // Dado antigo só tem valorMensal: era uma cobrança mensal, sem divisão
  const valorCobrado = Number(s.valorCobrado ?? s.valorMensal);
  const canceladaEm = status === "cancelada" ? s.canceladaEm ?? null : null;

  return {
    id: s.id,
    nome: String(s.nome).trim(),
    valorMensal: custoMensal(valorCobrado, ciclo, compartilhadaCom),
    ativo: STATUS_ASSINADOS.includes(status),
    categoria,
    tipo: tipoValido(s.tipo, categoria),
    canceladaEm,
    usoMensal: s.usoMensal ?? null,
    // Sprint 4
    historicoUso: Array.isArray(s.historicoUso) ? s.historicoUso.map((v) => ({ ...v })) : [],
    catalogoId: s.catalogoId ?? encontrarNoCatalogo(s.nome)?.id ?? null,
    status,
    ciclo,
    valorCobrado,
    compartilhadaCom,
    diaCobranca: s.diaCobranca ?? null,
    pausadaAte: status === "pausada" ? s.pausadaAte ?? null : null,
    fimTeste: status === "teste" ? s.fimTeste ?? null : null,
    historicoPrecos: Array.isArray(s.historicoPrecos)
      ? s.historicoPrecos.map((p) => ({ ...p }))
      : [{ valor: valorCobrado, ciclo, desde: null }],
    // Internos (não saem na API): data-base do calendário de cobranças e períodos sem cobrança
    dataBaseCobranca: s.dataBaseCobranca ?? null,
    periodosSemCobranca: periodosIniciais(s.periodosSemCobranca, status, canceladaEm),
  };
}

function diasAtras(dias, agora) {
  return new Date(agora.getTime() - dias * MS_POR_DIA).toISOString();
}

// Sprint 4: data-base do calendário de cobranças a partir de uma data de cobrança.
// No semanal o dia do mês não importa: as cobranças andam de 7 em 7 dias.
function ancoraNaData(data, ciclo, diaCobranca) {
  return {
    dataBaseCobranca: data,
    diaCobranca: ciclo === "semanal" ? null : diaCobranca ?? Number(data.slice(8, 10)),
  };
}

// O dia de cobrança dentro do mês de "data" (31 em abril vira 30)
function diaNoMes(data, dia) {
  const [ano, mes] = data.split("-").map(Number);
  return `${data.slice(0, 8)}${String(Math.min(dia, ultimoDiaDoMes(ano, mes))).padStart(2, "0")}`;
}

// Sprint 4: de onde sai o calendário: da próxima cobrança informada, do fim do teste
// grátis ou, no ciclo mensal, do dia de cobrança. Sem nada disso, não há calendário.
function ancoraInicial({ ciclo, diaCobranca, proximaCobranca, fimTeste }, dataHoje) {
  if (proximaCobranca) return ancoraNaData(proximaCobranca, ciclo, diaCobranca);
  if (fimTeste) return ancoraNaData(fimTeste, ciclo);
  if (diaCobranca && ciclo === "mensal") return ancoraNaData(diaNoMes(dataHoje, diaCobranca), ciclo, diaCobranca);
  return { dataBaseCobranca: null, diaCobranca: null };
}

// Sprint 4: a demo começa com dois cancelamentos antigos, cobranças nos próximos
// dias e um teste grátis acabando, tudo com datas relativas a "agora"
function seedPadrao(agora) {
  const dataHoje = hoje(agora);
  return SEED_INICIAL.map(({ canceladaHaDias, cobrancaEmDias, fimTesteEmDias, ...s }) => {
    const dados = { ...s };
    if (canceladaHaDias) dados.canceladaEm = diasAtras(canceladaHaDias, agora);
    if (cobrancaEmDias) Object.assign(dados, ancoraNaData(adicionarDias(dataHoje, cobrancaEmDias), CICLO_PADRAO));
    if (fimTesteEmDias) {
      dados.fimTeste = adicionarDias(dataHoje, fimTesteEmDias);
      Object.assign(dados, ancoraNaData(dados.fimTeste, CICLO_PADRAO));
    }
    return dados;
  });
}

// Sem seed, carrega a demo junto com o histórico dos cancelamentos antigos.
// Com seed (testes), a auditoria começa vazia.
function inicializar(seed, { agora = new Date() } = {}) {
  subscriptions = (seed ?? seedPadrao(agora)).map(normalizar);
  auditoria = [];
  configuracoes = { limitePercentualRenda: LIMITE_PERCENTUAL_RENDA_PADRAO };
  proximoIdLivre = Math.max(0, ...subscriptions.map((s) => s.id)) + 1;

  if (!seed) {
    subscriptions
      .filter((s) => s.canceladaEm)
      .sort((a, b) => a.canceladaEm.localeCompare(b.canceladaEm))
      .forEach((s) => registrarAuditoria(s, "cancelada", s.canceladaEm));
  }
}

function proximoId() {
  proximoIdLivre += 1;
  return proximoIdLivre - 1;
}

function encontrar(id) {
  return subscriptions.find((s) => s.id === Number(id));
}

function somarValorMensal(lista) {
  return somar(lista.map((s) => s.valorMensal));
}

// Quem ainda tem a assinatura: o "ativo" antigo (ativa ou em teste grátis)
function getAtivas() {
  return subscriptions.filter((s) => s.ativo);
}

// Sprint 4: quem está sendo cobrado agora. O teste grátis ainda não custa nada.
function getPagantes() {
  return subscriptions.filter((s) => s.status === "ativa");
}

function registrarAuditoria(assinatura, acao, data, extras = {}) {
  auditoria.push({
    id: auditoria.length + 1,
    assinaturaId: assinatura.id,
    nome: assinatura.nome,
    valorMensal: assinatura.valorMensal,
    acao,
    data,
    ...extras,
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

// Cópia "funda" o suficiente para os objetos internos também não vazarem por referência.
// Sprint 4: a data-base do calendário e os períodos sem cobrança são internos e não saem na API.
function copiar({ dataBaseCobranca, periodosSemCobranca, ...s }) {
  return {
    ...s,
    usoMensal: s.usoMensal ? { ...s.usoMensal } : null,
    historicoUso: s.historicoUso.map((v) => ({ ...v })),
    historicoPrecos: s.historicoPrecos.map((p) => ({ ...p })),
  };
}

// Sprint 4: o que sai na API: a cópia mais os campos calculados para hoje. Com o
// contexto do Perfil (montarContexto), traz também horas de trabalho e eficiência.
function paraApi(s, dataHoje, contexto = null) {
  const api = {
    ...copiar(s),
    proximaCobranca: proximaCobranca(s, dataHoje),
    economizadoAteHoje: calcularEconomizado(s, dataHoje),
  };
  // Verificação de uso com mais de 30 dias aparece como vencida
  if (api.usoMensal) api.usoMensal.vencida = !verificacaoValida(s.usoMensal, dataHoje);
  if (contexto) {
    api.horasDeTrabalho = contexto.valorHora > 0 ? arredondar(s.valorMensal / contexto.valorHora) : null;
    api.eficiencia = s.ativo ? calcularEficiencia(s, contexto, dataHoje) : null;
  }
  return api;
}

// Sprint 4: com o Perfil ({ valorHora, salario }), cada assinatura traz as horas de
// trabalho que custa por mês e o score de eficiência
function getSubscriptions({ agora = new Date(), perfil = null } = {}) {
  sincronizar(agora);
  const dataHoje = hoje(agora);
  const contexto = perfil ? montarContexto(perfil, dataHoje) : null;
  return subscriptions.map((s) => paraApi(s, dataHoje, contexto));
}

function getEconomiaTotal({ agora = new Date() } = {}) {
  sincronizar(agora);
  // Sprint 4: só é economia o que o usuário cancelou (tem canceladaEm). Uma inativa
  // sem data nunca foi cancelada por ele, e antes inflava este número. A pausa é
  // temporária e entra só na economia acumulada.
  const economiaMensal = somarValorMensal(subscriptions.filter((s) => s.status === "cancelada" && s.canceladaEm));
  const dataHoje = hoje(agora);

  return {
    economiaMensal,
    economiaAnual: multiplicar(economiaMensal, 12),
    // Sprint 4: cobranças que deixaram de acontecer até hoje, somando todos os
    // cancelamentos e pausas (inclusive de assinaturas que depois voltaram)
    economiaAcumulada: somar(subscriptions.map((s) => calcularEconomizado(s, dataHoje))),
  };
}

// Sprint 4: aceita o formato antigo (valorMensal) e o novo (valorCobrado + ciclo, dia
// ou data da próxima cobrança, divisão e teste grátis). Retorna { erro } acima do teto.
function addSubscription(dados, { agora = new Date() } = {}) {
  sincronizar(agora);
  const dataHoje = hoje(agora);
  const ciclo = CICLOS.includes(dados.ciclo) ? dados.ciclo : CICLO_PADRAO;
  const valorCobrado = Number(dados.valorCobrado ?? dados.valorMensal);
  const erro = erroDoTeto(valorCobrado, ciclo);
  if (erro) return { erro };

  const status = dados.status === "teste" ? "teste" : "ativa";
  const fimTeste = status === "teste" ? dados.fimTeste : null;
  // Sprint 4: serviço conhecido (escolhido no autocomplete ou reconhecido pelo nome)
  // completa a categoria e o tipo que não vieram
  const servico = (dados.catalogoId && servicoPorId(dados.catalogoId)) || encontrarNoCatalogo(dados.nome);
  const novaAssinatura = normalizar({
    id: proximoId(),
    nome: dados.nome,
    categoria: dados.categoria ?? servico?.categoria,
    tipo: dados.tipo !== undefined ? dados.tipo : servico?.tipo,
    catalogoId: servico?.id ?? null,
    status,
    ciclo,
    valorCobrado,
    compartilhadaCom: dados.compartilhadaCom,
    fimTeste,
    historicoPrecos: [{ valor: valorCobrado, ciclo, desde: dataHoje }],
    ...ancoraInicial(
      { ciclo, diaCobranca: dados.diaCobranca, proximaCobranca: dados.proximaCobranca, fimTeste },
      dataHoje
    ),
  });
  subscriptions.push(novaAssinatura);
  return paraApi(novaAssinatura, dataHoje);
}

function toggleSubscription(id, { agora = new Date() } = {}) {
  sincronizar(agora);
  const assinatura = encontrar(id);
  if (!assinatura) return null;

  // Sprint 4: com status, o toggle antigo cancela (ativa ou teste) ou reativa (pausada ou cancelada)
  mudarStatus(assinatura, assinatura.ativo ? "cancelada" : "ativa", { agora });
  return paraApi(assinatura, hoje(agora));
}

// Histórico de mudanças, do mais recente para o mais antigo
function getAuditoria({ agora = new Date() } = {}) {
  sincronizar(agora);
  return auditoria.map((e) => ({ ...e })).reverse();
}

// Sprint 4: alíquota do IR regressivo para um aporte que ficou "dias" aplicado
function aliquotaIr(dias) {
  return TABELA_IR.find((faixa) => dias <= faixa.ateDias).aliquota;
}

// Sprint 4: aportes mensais iguais aplicados por "meses", com o IR de cada aporte (o
// mais antigo rendeu por mais tempo e paga alíquota menor). Mesma convenção de
// montanteComAportes: o aporte k entra no fim do mês k.
function simularAportes(aporteMensal, meses, taxaMensal) {
  let montante = 0;
  let impostoRenda = 0;
  for (let k = 1; k <= meses; k += 1) {
    const mesesAplicado = meses - k;
    const ganho = aporteMensal * (Math.pow(1 + taxaMensal, mesesAplicado) - 1);
    montante += aporteMensal + ganho;
    impostoRenda += ganho * aliquotaIr(mesesAplicado * DIAS_POR_MES);
  }
  return { montante, impostoRenda };
}

// Sprint 4: soma das mensalidades com o preço subindo pelo IPCA a cada 12 meses
function totalComReajuste(valorMensal, meses, reajusteAnual) {
  let total = 0;
  for (let mes = 0; mes < meses; mes += 1) {
    total += valorMensal * Math.pow(1 + reajusteAnual, Math.floor(mes / 12));
  }
  return arredondar(total);
}

// Custo Invisível: quanto cada assinatura cobrada custa acumulada em 12, 36 e 60 meses.
// Sprint 4: também com reajuste anual pelo IPCA (comReajuste) e quanto o mesmo
// dinheiro viraria aplicado a 100% do CDI, já sem o IR (seInvestido): o custo de oportunidade.
function calcularCustoInvisivel({ agora = new Date(), ipca12m = IPCA_12M_REFERENCIA, taxaAnual = TAXA_ANUAL_CDI } = {}) {
  sincronizar(agora);
  const pagantes = getPagantes();
  const gastoMensal = somarValorMensal(pagantes);
  const taxaMensal = taxaMensalEquivalente(taxaAnual);

  const projetar = (valorMensal) =>
    PERIODOS_MESES.map((meses) => {
      const { montante, impostoRenda } = simularAportes(valorMensal, meses, taxaMensal);
      return {
        meses,
        valor: multiplicar(valorMensal, meses),
        comReajuste: totalComReajuste(valorMensal, meses, ipca12m),
        seInvestido: arredondar(montante - impostoRenda),
      };
    });

  const itens = pagantes.map((s) => ({
    id: s.id,
    nome: s.nome,
    categoria: s.categoria,
    valorMensal: s.valorMensal,
    projecoes: projetar(s.valorMensal),
  }));

  return {
    gastoMensal,
    reajusteAnualPercentual: arredondar(ipca12m * 100),
    itens,
    totais: projetar(gastoMensal),
  };
}

// Juros compostos: a economia das canceladas aplicada todo mês a 100% do CDI.
// Sprint 4: com o IR regressivo de cada aporte (montanteLiquido) e a origem da taxa
// ("bcb" quando veio do Banco Central, "fallback" quando é a de reserva).
function calcularProjecaoJuros(
  taxaAnual = TAXA_ANUAL_CDI,
  { agora = new Date(), fonteTaxa = "fallback", taxaAtualizadaEm = DATA_TAXAS_REFERENCIA } = {}
) {
  const { economiaMensal } = getEconomiaTotal({ agora });
  const taxaMensal = taxaMensalEquivalente(taxaAnual);

  const calcularPonto = (meses) => {
    const totalAportado = economiaMensal * meses;
    const montante = montanteComAportes(economiaMensal, meses, taxaMensal);
    const { impostoRenda } = simularAportes(economiaMensal, meses, taxaMensal);
    const montanteBruto = arredondar(montante);
    const imposto = arredondar(impostoRenda);
    return {
      meses,
      totalAportado: arredondar(totalAportado),
      montante: montanteBruto,
      rendimento: arredondar(montante - totalAportado),
      impostoRenda: imposto,
      // Do bruto e do imposto já arredondados, para a conta fechar na tela
      montanteLiquido: arredondar(montanteBruto - imposto),
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
    fonteTaxa,
    taxaAtualizadaEm,
    periodos: PERIODOS_MESES.map(calcularPonto),
    curva,
  };
}

// Horas de trabalho por mês necessárias só para pagar as assinaturas cobradas.
// Recebe valorHora/horasMensais de fora (vêm do Perfil) para não acoplar os models.
function calcularHorasTrabalho({ valorHora, horasMensais } = {}, { agora = new Date() } = {}) {
  sincronizar(agora);
  const gastoMensal = somarValorMensal(getPagantes());
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
function getResumoDetox({ agora = new Date() } = {}) {
  sincronizar(agora);
  const contar = (status) => subscriptions.filter((s) => s.status === status).length;
  return {
    totalAssinaturas: subscriptions.length,
    ativas: getAtivas().length,
    canceladas: contar("cancelada"),
    pausadas: contar("pausada"),
    gastoMensalAtivo: somarValorMensal(getPagantes()),
    ...getEconomiaTotal({ agora }),
  };
}

// ---------------------------------------------------------------------------
// Sprint 3 - Custo por uso
// ---------------------------------------------------------------------------

// Sprint 4: com a referência do tipo, metade dela ou menos é excelente e até ela é
// neutro. Sem tipo, valem os limites gerais da Sprint 3.
function classificarCustoPorUso(custoPorUso, referencia = null) {
  if (custoPorUso === null) return "prejuizo"; // pagou e não usou nenhuma vez
  const limiteExcelente = referencia ? referencia / 2 : LIMITE_CUSTO_EXCELENTE;
  const limiteNeutro = referencia ?? LIMITE_CUSTO_NEUTRO;
  if (custoPorUso <= limiteExcelente) return "excelente";
  if (custoPorUso <= limiteNeutro) return "neutro";
  return "prejuizo";
}

// Sprint 4: como medir o custo-benefício de cada tipo: contando usos (com a
// referência do tipo), com uma pergunta ou, no plano de saúde, de jeito nenhum
function formaDeVerificar(tipo) {
  if (tipo == null) return { forma: "uso", referencia: null, explicacao: EXPLICACAO_SEM_TIPO };
  if (USO_POR_TIPO[tipo]) return { forma: "uso", ...USO_POR_TIPO[tipo] };
  if (PERGUNTA_POR_TIPO[tipo]) return { forma: "pergunta", pergunta: PERGUNTA_POR_TIPO[tipo] };
  return { forma: "nenhuma" };
}

// Sprint 4: verificação velha não decide mais nada; vale até validaAte
function verificacaoValida(usoMensal, dataHoje) {
  return Boolean(usoMensal?.validaAte) && usoMensal.validaAte >= dataHoje;
}

// Sprint 4: POST /:id/usage-check. Nos tipos com "uso", divide a mensalidade pelos
// usos e compara com a referência do tipo; nos tipos com pergunta, guarda a
// resposta. A verificação vale 30 dias e entra no histórico. Retorna null se o id
// não existir e { erro } se a assinatura não estiver ativa ou faltar o dado do tipo.
function verificarUso(id, { frequenciaUso, resposta } = {}, { agora = new Date() } = {}) {
  sincronizar(agora);
  const assinatura = encontrar(id);
  if (!assinatura) return null;
  // Medir o uso de algo cancelado ou pausado não faz sentido (o controller responde 400)
  if (!assinatura.ativo) {
    const comoVoltar = assinatura.status === "pausada" ? "Retome-a" : "Reative-a";
    return {
      erro: `A assinatura '${assinatura.nome}' está ${STATUS_NA_FRASE[assinatura.status]}. ${comoVoltar} para verificar o uso.`,
    };
  }

  const como = formaDeVerificar(assinatura.tipo);
  let verificacao;
  if (como.forma === "nenhuma") {
    return {
      erro: `Para ${ROTULOS_TIPO[assinatura.tipo].descricao}, o Detox não mede custo por uso: é proteção, e não algo que se usa todo mês.`,
    };
  }
  if (como.forma === "pergunta") {
    if (typeof resposta !== "boolean") {
      return { erro: `Para este tipo, envie 'resposta' (true ou false): ${como.pergunta}` };
    }
    // "Sim" quer dizer que vale manter
    verificacao = {
      forma: "pergunta",
      pergunta: como.pergunta,
      resposta,
      classificacao: resposta ? "neutro" : "prejuizo",
    };
  } else {
    if (frequenciaUso == null) {
      return { erro: "Envie 'frequenciaUso': quantas vezes você usou no último mês." };
    }
    const usos = Number(frequenciaUso);
    const custoPorUso = usos > 0 ? arredondar(assinatura.valorMensal / usos) : null;
    verificacao = {
      forma: "uso",
      frequenciaUso: usos,
      custoPorUso,
      referencia: como.referencia,
      classificacao: classificarCustoPorUso(custoPorUso, como.referencia),
    };
  }
  verificacao.verificadoEm = agora.toISOString();
  verificacao.validaAte = adicionarDias(hoje(agora), VALIDADE_VERIFICACAO_DIAS);

  assinatura.usoMensal = verificacao;
  assinatura.historicoUso = [...assinatura.historicoUso, { ...verificacao }].slice(-HISTORICO_USO_MAXIMO);

  return {
    id: assinatura.id,
    nome: assinatura.nome,
    valorMensal: assinatura.valorMensal,
    ...verificacao,
  };
}

// Calcula quanto custa cada uso no mês e guarda o resultado na assinatura, para a
// lista e o detector de zumbis usarem depois. Sprint 4: virou atalho de verificarUso.
function calcularCustoUso(id, frequenciaUso, opcoes) {
  return verificarUso(id, { frequenciaUso }, opcoes);
}

// ---------------------------------------------------------------------------
// Sprint 3 - Detector de assinaturas zumbis (concorrentes)
// ---------------------------------------------------------------------------

// Ordem de "pior para manter": quem foi verificado como prejuízo vem primeiro,
// depois quem nunca foi verificado, e por último neutro/excelente.
const PESO_CLASSIFICACAO = { prejuizo: 0, sem_verificacao: 1, neutro: 2, excelente: 3 };

// Sprint 4: verificação vencida conta como "sem verificação"
function pesoParaManter(s, dataHoje) {
  const classificacao = verificacaoValida(s.usoMensal, dataHoje) ? s.usoMensal.classificacao : "sem_verificacao";
  return PESO_CLASSIFICACAO[classificacao];
}

// "2026-11-08" -> "08/11"
function diaEMes(data) {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

// Sugere pausar UMA assinatura do grupo: a de pior custo-benefício;
// empatando, a mais cara. O usuário continua com as outras.
function escolherSugestaoPausa(grupo, dataHoje) {
  const ordenado = [...grupo].sort(
    (a, b) => pesoParaManter(a, dataHoje) - pesoParaManter(b, dataHoje) || b.valorMensal - a.valorMensal
  );
  const escolhida = ordenado[0];
  const verificacao = verificacaoValida(escolhida.usoMensal, dataHoje) ? escolhida.usoMensal : null;

  let motivo = "É a mais cara entre serviços que fazem a mesma coisa.";
  if (escolhida.status === "teste" && escolhida.fimTeste) {
    // Sprint 4: um teste grátis cancelado antes do fim nem chega a cobrar
    motivo = `Ainda está no teste grátis: cancelando antes de ${diaEMes(escolhida.fimTeste)}, a primeira cobrança não acontece.`;
  } else if (verificacao?.forma === "uso" && verificacao.frequenciaUso === 0) {
    motivo = "Você não usou nenhuma vez no último mês.";
  } else if (verificacao?.classificacao === "prejuizo") {
    motivo =
      verificacao.forma === "uso"
        ? `Custo por uso alto: R$ ${verificacao.custoPorUso.toFixed(2).replace(".", ",")} a cada vez que você usa.`
        : "Pela sua resposta, ela não está compensando.";
  }

  return {
    id: escolhida.id,
    nome: escolhida.nome,
    // Sprint 4: o app troca "Pausar" por "Cancelar teste" quando é um teste grátis
    status: escolhida.status,
    economiaMensal: arredondar(escolhida.valorMensal),
    economiaAnual: multiplicar(escolhida.valorMensal, 12),
    motivo,
  };
}

// Grupos de assinaturas ativas (ou em teste) do mesmo tipo, com a sugestão de cada um.
// Sprint 4: separado para o score de eficiência e a revisão do mês usarem também.
function gruposDeConcorrentes(dataHoje) {
  const porTipo = {};
  getAtivas()
    .filter((s) => s.tipo)
    .forEach((s) => {
      porTipo[s.tipo] = porTipo[s.tipo] || [];
      porTipo[s.tipo].push(s);
    });

  return Object.entries(porTipo)
    .filter(([, lista]) => lista.length >= 2)
    .map(([tipo, lista]) => ({ tipo, lista, sugestaoPausa: escolherSugestaoPausa(lista, dataHoje) }));
}

function detectarRedundancias({ agora = new Date() } = {}) {
  sincronizar(agora);
  const dataHoje = hoje(agora);

  const grupos = gruposDeConcorrentes(dataHoje)
    .map(({ tipo, lista, sugestaoPausa }) => ({
      tipo,
      categoria: lista[0].categoria,
      quantidade: lista.length,
      gastoMensal: somarValorMensal(lista),
      assinaturas: lista.map((s) => paraApi(s, dataHoje)),
      sugestaoPausa,
    }))
    .sort((a, b) => b.gastoMensal - a.gastoMensal);

  const economiaPotencialMensal = somar(grupos.map((g) => g.sugestaoPausa.economiaMensal));

  return {
    totalGrupos: grupos.length,
    economiaPotencialMensal,
    economiaPotencialAnual: multiplicar(economiaPotencialMensal, 12),
    grupos,
  };
}

// ---------------------------------------------------------------------------
// Sprint 4 - Calendário de cobranças
// ---------------------------------------------------------------------------

// A k-ésima cobrança contada a partir da data-base (k = 0 é a própria data-base)
function cobrancaNumero(calendario, k) {
  if (calendario.ciclo === "semanal") return adicionarDias(calendario.dataBaseCobranca, 7 * k);
  return adicionarMeses(
    calendario.dataBaseCobranca,
    k * MESES_POR_CICLO[calendario.ciclo],
    calendario.diaCobranca ?? undefined
  );
}

// Primeira cobrança na data informada ou depois dela (incluirDia = false: só depois)
function primeiraCobrancaDesde(s, data, incluirDia = true) {
  if (!s.dataBaseCobranca) return null;
  let k = 0;
  while (incluirDia ? cobrancaNumero(s, k) < data : cobrancaNumero(s, k) <= data) k += 1;
  return cobrancaNumero(s, k);
}

// Próxima cobrança a partir de hoje. Pausada: a primeira depois da retomada.
function proximaCobranca(s, dataHoje) {
  if (s.status === "cancelada") return null;
  if (s.status === "pausada") return s.pausadaAte ? primeiraCobrancaDesde(s, s.pausadaAte) : null;
  return primeiraCobrancaDesde(s, dataHoje);
}

function tipoDoEvento(s, data, primeiraDaJanela) {
  if (s.status === "teste" && data === s.fimTeste) return "fim_teste";
  if (s.status === "pausada" && primeiraDaJanela) return "retomada";
  return "cobranca";
}

// GET /upcoming: cobranças de hoje até "dias" à frente, com fim de teste grátis e
// volta de pausa. semData conta quem não tem dia de cobrança cadastrado.
function getProximasCobrancas({ dias = 7, agora = new Date() } = {}) {
  sincronizar(agora);
  const de = hoje(agora);
  const ate = adicionarDias(de, dias);
  const itens = [];
  let semData = 0;

  subscriptions
    .filter((s) => s.status !== "cancelada")
    .forEach((s) => {
      if (!s.dataBaseCobranca) {
        semData += 1;
        return;
      }
      const inicio = s.status === "pausada" && s.pausadaAte > de ? s.pausadaAte : de;
      let data = primeiraCobrancaDesde(s, inicio);
      let primeira = true;
      while (data <= ate) {
        itens.push({
          id: s.id,
          nome: s.nome,
          data,
          diasRestantes: diasEntre(de, data),
          valor: s.valorCobrado,
          suaParte: suaParte(s),
          tipo: tipoDoEvento(s, data, primeira),
        });
        primeira = false;
        data = primeiraCobrancaDesde(s, data, false);
      }
    });

  itens.sort((a, b) => a.data.localeCompare(b.data) || a.nome.localeCompare(b.nome));
  return { dias, de, ate, total: somar(itens.map((i) => i.valor)), semData, itens };
}

// ---------------------------------------------------------------------------
// Sprint 4 - Status, edição e exclusão
// ---------------------------------------------------------------------------

function acaoDaMudanca(anterior, novo) {
  if (novo !== "ativa") return { cancelada: "cancelada", pausada: "pausada", teste: "teste_iniciado" }[novo];
  return { cancelada: "reativada", pausada: "retomada", teste: "teste_encerrado" }[anterior];
}

// Troca o status mantendo coerentes o "ativo", as datas de cada status e os
// períodos sem cobrança (abre um ao pausar ou cancelar, fecha ao voltar).
function aplicarStatus(s, novo, { dataHoje, instante, pausadaAte = null, fimTeste = null, fimDoPeriodo = dataHoje }) {
  const estavaSemCobranca = STATUS_SEM_COBRANCA.includes(s.status);
  const ficaSemCobranca = STATUS_SEM_COBRANCA.includes(novo);

  if (!estavaSemCobranca && ficaSemCobranca) {
    s.periodosSemCobranca.push({ inicio: dataHoje, fim: null });
  } else if (estavaSemCobranca && !ficaSemCobranca) {
    const aberto = s.periodosSemCobranca.find((p) => p.fim === null);
    if (aberto) aberto.fim = fimDoPeriodo;
  }

  s.status = novo;
  s.ativo = STATUS_ASSINADOS.includes(novo);
  s.canceladaEm = novo === "cancelada" ? instante : null;
  s.pausadaAte = novo === "pausada" ? pausadaAte : null;
  s.fimTeste = novo === "teste" ? fimTeste : null;
  // O teste grátis acaba na primeira cobrança: ela vira a data-base do calendário
  if (novo === "teste") Object.assign(s, ancoraNaData(fimTeste, s.ciclo));
}

// Mudança de status feita pelo usuário (toggle ou PATCH /:id/status), com auditoria
function mudarStatus(s, novo, { agora, pausadaAte = null, fimTeste = null }) {
  const anterior = s.status;
  const instante = agora.toISOString();
  aplicarStatus(s, novo, { dataHoje: hoje(agora), instante, pausadaAte, fimTeste });
  registrarAuditoria(s, acaoDaMudanca(anterior, novo), instante, novo === "pausada" ? { pausadaAte } : {});
}

// Aplica as mudanças que vencem sozinhas: pausa que chegou à data de retomada e
// teste grátis que acabou. Roda no começo de cada operação e grava no histórico a
// data em que a mudança valeu, não a hora em que alguém abriu o app.
function sincronizar(agora) {
  const dataHoje = hoje(agora);
  subscriptions
    .map((s) => ({ s, vencimento: { pausada: s.pausadaAte, teste: s.fimTeste }[s.status] }))
    .filter(({ vencimento }) => vencimento && vencimento <= dataHoje)
    // Várias vencendo de uma vez entram no histórico na ordem em que aconteceram
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    .forEach(({ s, vencimento }) => {
      const anterior = s.status;
      const instante = inicioDoDia(vencimento);
      aplicarStatus(s, "ativa", { dataHoje, instante, fimDoPeriodo: vencimento });
      registrarAuditoria(s, acaoDaMudanca(anterior, "ativa"), instante);
    });
}

// PATCH /:id/status. Retorna null se o id não existir e { erro } se a mudança não
// fizer sentido (ex.: cancelar o que já está cancelado).
function alterarStatus(id, { status, pausadaAte = null, fimTeste = null }, { agora = new Date() } = {}) {
  sincronizar(agora);
  const assinatura = encontrar(id);
  if (!assinatura) return null;

  // Repetir o status só vale para trocar a data da pausa ou do fim do teste
  const mudaData =
    (status === "pausada" && pausadaAte !== assinatura.pausadaAte) ||
    (status === "teste" && fimTeste !== assinatura.fimTeste);
  if (status === assinatura.status && !mudaData) {
    return { erro: `A assinatura '${assinatura.nome}' já está ${STATUS_NA_FRASE[status]}.` };
  }

  mudarStatus(assinatura, status, { agora, pausadaAte, fimTeste });
  return paraApi(assinatura, hoje(agora));
}

// PATCH /:id. Edita os dados (o status tem rota própria). Se o valor ou o ciclo
// mudar, o preço novo entra no histórico e na auditoria. Retorna null se o id não
// existir e { erro } se o resultado não puder ser salvo.
function updateSubscription(id, dados, { agora = new Date() } = {}) {
  sincronizar(agora);
  const assinatura = encontrar(id);
  if (!assinatura) return null;

  const dataHoje = hoje(agora);
  const ciclo = dados.ciclo ?? assinatura.ciclo;
  const valorCobrado = dados.valorCobrado != null ? Number(dados.valorCobrado) : assinatura.valorCobrado;
  const compartilhadaCom = dados.compartilhadaCom ?? assinatura.compartilhadaCom;

  const erroTeto = erroDoTeto(valorCobrado, ciclo);
  if (erroTeto) return { erro: erroTeto };

  const novoCalendario = dados.proximaCobranca != null || dados.diaCobranca != null;
  if (novoCalendario && dados.proximaCobranca == null && ciclo !== "mensal") {
    return { erro: "Para esse ciclo, informe 'proximaCobranca' (a data da próxima cobrança) em vez de 'diaCobranca'." };
  }

  const categoria = categoriaValida(
    dados.categoria ?? (dados.tipo != null ? categoriaDoTipo(dados.tipo) : assinatura.categoria)
  );
  const mudouPreco = valorCobrado !== assinatura.valorCobrado || ciclo !== assinatura.ciclo;
  const valorAnterior = assinatura.valorMensal;

  if (dados.nome !== undefined) assinatura.nome = String(dados.nome).trim();
  assinatura.categoria = categoria;
  // Trocar a categoria sem mandar tipo descarta o tipo que não serve mais
  assinatura.tipo = tipoValido(dados.tipo !== undefined ? dados.tipo : assinatura.tipo, categoria);
  assinatura.ciclo = ciclo;
  assinatura.valorCobrado = valorCobrado;
  assinatura.compartilhadaCom = compartilhadaCom;
  assinatura.valorMensal = custoMensal(valorCobrado, ciclo, compartilhadaCom);
  if (novoCalendario) {
    Object.assign(
      assinatura,
      ancoraInicial({ ciclo, diaCobranca: dados.diaCobranca, proximaCobranca: dados.proximaCobranca }, dataHoje)
    );
  } else if (ciclo === "semanal") {
    assinatura.diaCobranca = null;
  }

  if (mudouPreco) {
    assinatura.historicoPrecos.push({ valor: valorCobrado, ciclo, desde: dataHoje });
    registrarAuditoria(assinatura, "preco_alterado", agora.toISOString(), { valorAnterior });
  }
  return paraApi(assinatura, dataHoje);
}

// DELETE /:id. Remover é para cadastro errado: diferente de cancelar, a assinatura
// sai também da economia. O evento fica na auditoria.
function removeSubscription(id, { agora = new Date() } = {}) {
  sincronizar(agora);
  const indice = subscriptions.findIndex((s) => s.id === Number(id));
  if (indice === -1) return null;

  const [removida] = subscriptions.splice(indice, 1);
  registrarAuditoria(removida, "removida", agora.toISOString());
  return paraApi(removida, hoje(agora));
}

// GET /meta: taxonomia, limites e checklist para o app não repetir rótulos
function getMeta() {
  return {
    categorias: CATEGORIAS.map((valor) => ({
      valor,
      rotulo: ROTULOS_CATEGORIA[valor],
      // Como o app verifica o custo-benefício de cada tipo (uso, pergunta ou nenhuma)
      tipos: TIPOS_POR_CATEGORIA[valor].map((tipo) => ({
        valor: tipo,
        ...ROTULOS_TIPO[tipo],
        verificacao: formaDeVerificar(tipo),
      })),
    })),
    verificacaoSemTipo: formaDeVerificar(null),
    ciclos: CICLOS.map((valor) => ({ valor, ...ROTULOS_CICLO[valor] })),
    status: STATUS.map((valor) => ({ valor, rotulo: ROTULOS_STATUS[valor] })),
    limites: {
      valorMensalMaximo: VALOR_MENSAL_MAXIMO,
      nomeMaximo: NOME_MAXIMO,
      compartilhadaComMaximo: COMPARTILHADA_COM_MAXIMO,
      limitePercentualRendaMaximo: LIMITE_PERCENTUAL_RENDA_MAXIMO,
    },
    checklist: CHECKLIST.map((item) => ({ ...item })),
  };
}

// ---------------------------------------------------------------------------
// Sprint 4 - Eficiência, limite de gasto, revisão do mês e guia de cancelamento
// ---------------------------------------------------------------------------

// 1.142 -> "1,1%"
function percentualNaFrase(valor) {
  return `${valor.toFixed(1).replace(".", ",")}%`;
}

// O que o score e a revisão precisam além da assinatura: o Perfil (somente
// leitura, vem do controller) e quem está em grupo de concorrentes
function montarContexto({ valorHora, salario } = {}, dataHoje) {
  const grupos = gruposDeConcorrentes(dataHoje);
  return {
    valorHora: Number(valorHora),
    salario: Number(salario),
    idsConcorrentes: new Set(grupos.flatMap((g) => g.lista.map((s) => s.id))),
    idsSugeridos: new Set(grupos.map((g) => g.sugestaoPausa.id)),
  };
}

// Score de eficiência de 0 a 100: quanto maior, mais a assinatura vale o que custa.
// Começa em 100 e perde:
//   custo-benefício da última verificação válida: neutro -15, prejuízo -40
//   nenhuma verificação nos últimos 30 dias: -10 (plano de saúde não perde, não se mede)
//   outro serviço ativo do mesmo tipo: -20
//   peso na renda: -8 por ponto percentual do salário, até -20
// nivel: "bom" (70 ou mais), "atencao" (40 a 69) ou "ruim" (abaixo de 40)
function calcularEficiencia(s, { salario, idsConcorrentes }, dataHoje) {
  const fatores = [];

  if (verificacaoValida(s.usoMensal, dataHoje)) {
    const pontos = PENALIDADE_CUSTO_BENEFICIO[s.usoMensal.classificacao];
    if (pontos > 0) {
      const motivo =
        s.usoMensal.classificacao === "prejuizo"
          ? "Custo-benefício ruim na última verificação"
          : "Custo-benefício só razoável na última verificação";
      fatores.push({ fator: "custo_beneficio", pontos: -pontos, motivo });
    }
  } else if (formaDeVerificar(s.tipo).forma !== "nenhuma") {
    fatores.push({
      fator: "sem_verificacao",
      pontos: -PENALIDADE_SEM_VERIFICACAO,
      motivo: "Uso não verificado nos últimos 30 dias",
    });
  }

  if (idsConcorrentes.has(s.id)) {
    fatores.push({
      fator: "concorrente",
      pontos: -PENALIDADE_CONCORRENTE,
      motivo: "Outro serviço ativo faz a mesma coisa",
    });
  }

  if (salario > 0) {
    const percentual = (s.valorMensal / salario) * 100;
    const pontos = Math.min(PENALIDADE_RENDA_MAXIMA, Math.round(percentual * PENALIDADE_POR_PONTO_DA_RENDA));
    if (pontos > 0) {
      fatores.push({ fator: "renda", pontos: -pontos, motivo: `Consome ${percentualNaFrase(percentual)} da sua renda` });
    }
  }

  const score = Math.max(0, 100 + fatores.reduce((total, f) => total + f.pontos, 0));
  const nivel = score >= SCORE_BOM ? "bom" : score >= SCORE_ATENCAO ? "atencao" : "ruim";
  return { score, nivel, fatores };
}

// Quanto da renda vai para as assinaturas cobradas, comparado à meta escolhida.
// Sem salário no Perfil, os valores que dependem dele ficam nulos.
function calcularLimiteDeGasto({ salario, agora = new Date() } = {}) {
  sincronizar(agora);
  const gastoMensal = somarValorMensal(getPagantes());
  const limitePercentual = configuracoes.limitePercentualRenda;
  const renda = Number(salario);

  if (!(renda > 0)) {
    return {
      limitePercentual,
      gastoMensal,
      salario: null,
      limiteMensal: null,
      percentualAtual: null,
      acimaDoLimite: false,
    };
  }

  const limiteMensal = multiplicar(renda, limitePercentual / 100);
  return {
    limitePercentual,
    gastoMensal,
    salario: renda,
    limiteMensal,
    percentualAtual: arredondar((gastoMensal / renda) * 100),
    acimaDoLimite: gastoMensal > limiteMensal,
  };
}

function getConfiguracoes() {
  return { ...configuracoes };
}

// PATCH /settings (a validação vem pronta do middleware)
function atualizarConfiguracoes({ limitePercentualRenda }) {
  if (limitePercentualRenda !== undefined) configuracoes.limitePercentualRenda = Number(limitePercentualRenda);
  return getConfiguracoes();
}

// Sugestão de cada cartão da revisão do mês
function sugestaoDaRevisao(assinatura, contexto) {
  if (assinatura.status === "teste") {
    return {
      sugestao: "decidir",
      motivo: `O teste grátis acaba em ${diaEMes(assinatura.fimTeste)}: se não for continuar, cancele antes.`,
    };
  }
  const verificacao = assinatura.usoMensal && !assinatura.usoMensal.vencida ? assinatura.usoMensal : null;
  if (verificacao?.classificacao === "prejuizo") {
    const motivo =
      verificacao.forma === "uso" ? "O custo por uso está alto." : "Pela sua resposta, ela não está compensando.";
    return { sugestao: "cancelar", motivo };
  }
  if (contexto.idsSugeridos.has(assinatura.id)) {
    return { sugestao: "pausar", motivo: "Outro serviço ativo faz a mesma coisa." };
  }
  const { forma } = formaDeVerificar(assinatura.tipo);
  if (!verificacao && forma !== "nenhuma") {
    const motivo =
      forma === "pergunta"
        ? "Responda uma pergunta rápida para saber se ela compensa."
        : "Confira quanto você usou neste mês.";
    return { sugestao: "verificar", motivo };
  }
  return { sugestao: "manter", motivo: "Está valendo o que custa." };
}

// GET /review ("Detox do mês"): um cartão por assinatura ativa ou em teste, da que
// mais pede atenção (menor score) para a que menos pede, com a forma de verificar o
// uso e uma sugestão (cancelar, pausar, verificar, decidir ou manter)
function getRevisaoDoMes({ perfil = {}, agora = new Date() } = {}) {
  sincronizar(agora);
  const dataHoje = hoje(agora);
  const contexto = montarContexto(perfil, dataHoje);

  const itens = getAtivas()
    .map((s) => {
      const assinatura = paraApi(s, dataHoje, contexto);
      return { assinatura, verificacao: formaDeVerificar(s.tipo), ...sugestaoDaRevisao(assinatura, contexto) };
    })
    .sort(
      (a, b) =>
        a.assinatura.eficiencia.score - b.assinatura.eficiencia.score ||
        b.assinatura.valorMensal - a.assinatura.valorMensal
    );

  return {
    mes: dataHoje.slice(0, 7),
    valorHora: contexto.valorHora > 0 ? contexto.valorHora : null,
    gastoMensal: somarValorMensal(getPagantes()),
    itens,
  };
}

// Bancos, cartões, seguros e planos de saúde são serviços regulados pelo governo
// federal (vale o Decreto 11.034); streaming e aplicativos, não
function ehServicoRegulado(s) {
  return s.categoria === "financeiro" || s.tipo === "plano_saude";
}

// GET /:id/cancel-guide: passo a passo, link oficial (quando o serviço está no
// catálogo), lojas de aplicativo e os direitos que valem para o caso
function getGuiaDeCancelamento(id, { agora = new Date() } = {}) {
  sincronizar(agora);
  const assinatura = encontrar(id);
  if (!assinatura) return null;

  const servico =
    (assinatura.catalogoId && servicoPorId(assinatura.catalogoId)) || encontrarNoCatalogo(assinatura.nome);
  const regulado = ehServicoRegulado(assinatura);

  return {
    assinatura: paraApi(assinatura, hoje(agora)),
    servico: servico ? { id: servico.id, nome: servico.nome } : null,
    linkCancelamento: servico?.linkCancelamento ?? null,
    passos: [...PASSOS_PARA_CANCELAR],
    lojas: LOJAS_DE_APLICATIVOS.map((loja) => ({ ...loja })),
    direitos: DIREITOS_DO_CONSUMIDOR.filter((d) => !d.regulados || regulado).map(({ regulados, ...d }) => d),
    aviso: AVISO_JURIDICO,
  };
}

// ---------------------------------------------------------------------------
// Sprint 4 - Economia acumulada
// ---------------------------------------------------------------------------

// Quantas cobranças deixaram de acontecer num período sem cobrança. A cobrança do
// dia do corte já estava paga. Período aberto: a de hoje já conta como economizada.
// Período fechado: a do dia da volta não conta, porque voltar volta a cobrar.
function contarCobrancasPuladas(s, { inicio, fim }, dataHoje) {
  // Sem calendário cadastrado, considera uma cobrança por mês no dia do corte
  const calendario = s.dataBaseCobranca ? s : { dataBaseCobranca: inicio, ciclo: "mensal", diaCobranca: null };
  const pulou = (data) => (fim ? data < fim : data <= dataHoje);

  let k = 0;
  while (cobrancaNumero(calendario, k) <= inicio) k += 1;

  let cobrancas = 0;
  while (pulou(cobrancaNumero(calendario, k))) {
    cobrancas += 1;
    k += 1;
  }
  return cobrancas;
}

// Quanto a assinatura deixou de cobrar até hoje. Os períodos não se sobrepõem,
// então cancelar, reativar e cancelar de novo não conta a mesma cobrança duas vezes.
function calcularEconomizado(s, dataHoje) {
  const cobrancas = s.periodosSemCobranca.reduce(
    (total, periodo) => total + contarCobrancasPuladas(s, periodo, dataHoje),
    0
  );
  // Sem calendário, a conta é mês a mês; com calendário, cobrança a cobrança
  return multiplicar(s.dataBaseCobranca ? suaParte(s) : s.valorMensal, cobrancas);
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
  // Sprint 4
  updateSubscription,
  removeSubscription,
  alterarStatus,
  getProximasCobrancas,
  getMeta,
  verificarUso,
  calcularLimiteDeGasto,
  getConfiguracoes,
  atualizarConfiguracoes,
  getRevisaoDoMes,
  getGuiaDeCancelamento,
  CATEGORIAS,
  TIPOS_POR_CATEGORIA,
  CICLOS,
  STATUS,
  TAXA_ANUAL_CDI,
  IPCA_12M_REFERENCIA,
  DATA_TAXAS_REFERENCIA,
  PERIODOS_MESES,
  VALOR_MENSAL_MAXIMO,
  NOME_MAXIMO,
  COMPARTILHADA_COM_MAXIMO,
  LIMITE_PERCENTUAL_RENDA_MAXIMO,
  // Apenas para testes
  _resetForTests: inicializar,
};
