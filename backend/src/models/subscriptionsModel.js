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
 * subscriptionsTaxonomia.js.
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
  CICLOS,
  CICLO_PADRAO,
  MESES_POR_CICLO,
  ROTULOS_CICLO,
  STATUS,
  ROTULOS_STATUS,
  CHECKLIST,
} = require("./subscriptionsTaxonomia");

// Taxa anual de referência (100% do CDI).
// Atualizar quando o Copom mudar a Selic. Referência: CDI 13,65% a.a.
// (Banco Central, série SGS 4389, 29/10/2026)
const TAXA_ANUAL_CDI = 0.1365;

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
  { id: 8, nome: "Aplicativo de Idiomas", valorCobrado: 34.9, status: "teste", categoria: "outros", fimTesteEmDias: 5 },
];

let subscriptions = [];
let auditoria = [];
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
    historicoPrecos: s.historicoPrecos.map((p) => ({ ...p })),
  };
}

// Sprint 4: o que sai na API: a cópia mais os campos calculados para hoje
function paraApi(s, dataHoje) {
  return {
    ...copiar(s),
    proximaCobranca: proximaCobranca(s, dataHoje),
    economizadoAteHoje: calcularEconomizado(s, dataHoje),
  };
}

function getSubscriptions({ agora = new Date() } = {}) {
  sincronizar(agora);
  const dataHoje = hoje(agora);
  return subscriptions.map((s) => paraApi(s, dataHoje));
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
  const novaAssinatura = normalizar({
    id: proximoId(),
    nome: dados.nome,
    categoria: dados.categoria,
    tipo: dados.tipo,
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

// Custo Invisível: quanto cada assinatura cobrada custa acumulada em 12, 36 e 60 meses
function calcularCustoInvisivel({ agora = new Date() } = {}) {
  sincronizar(agora);
  const pagantes = getPagantes();
  const gastoMensal = somarValorMensal(pagantes);

  const itens = pagantes.map((s) => ({
    id: s.id,
    nome: s.nome,
    categoria: s.categoria,
    valorMensal: s.valorMensal,
    projecoes: PERIODOS_MESES.map((meses) => ({
      meses,
      valor: multiplicar(s.valorMensal, meses),
    })),
  }));

  const totais = PERIODOS_MESES.map((meses) => ({
    meses,
    valor: multiplicar(gastoMensal, meses),
  }));

  return { gastoMensal, itens, totais };
}

// Juros compostos: a economia das canceladas aplicada todo mês a 100% do CDI
function calcularProjecaoJuros(taxaAnual = TAXA_ANUAL_CDI, { agora = new Date() } = {}) {
  const { economiaMensal } = getEconomiaTotal({ agora });
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

function classificarCustoPorUso(custoPorUso) {
  if (custoPorUso === null) return "prejuizo"; // pagou e não usou nenhuma vez
  if (custoPorUso <= LIMITE_CUSTO_EXCELENTE) return "excelente";
  if (custoPorUso <= LIMITE_CUSTO_NEUTRO) return "neutro";
  return "prejuizo";
}

// Calcula quanto custa cada uso no mês e guarda o resultado na assinatura,
// para a lista e o detector de zumbis poderem usar depois.
// Retorna null se o id não existir e { erro } se ela estiver cancelada ou pausada.
function calcularCustoUso(id, frequenciaUso, { agora = new Date() } = {}) {
  sincronizar(agora);
  const assinatura = encontrar(id);
  if (!assinatura) return null;
  // Sprint 4: medir o uso de algo cancelado ou pausado não faz sentido (o controller responde 400)
  if (!assinatura.ativo) {
    const comoVoltar = assinatura.status === "pausada" ? "Retome-a" : "Reative-a";
    return {
      erro: `A assinatura '${assinatura.nome}' está ${STATUS_NA_FRASE[assinatura.status]}. ${comoVoltar} para verificar o uso.`,
    };
  }

  const usos = Number(frequenciaUso);
  const custoPorUso = usos > 0 ? arredondar(assinatura.valorMensal / usos) : null;

  assinatura.usoMensal = {
    frequenciaUso: usos,
    custoPorUso,
    classificacao: classificarCustoPorUso(custoPorUso),
    verificadoEm: agora.toISOString(),
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

// "2026-11-08" -> "08/11"
function diaEMes(data) {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

// Sugere pausar UMA assinatura do grupo: a de pior custo-benefício;
// empatando, a mais cara. O usuário continua com as outras.
function escolherSugestaoPausa(grupo) {
  const ordenado = [...grupo].sort(
    (a, b) => pesoParaManter(a) - pesoParaManter(b) || b.valorMensal - a.valorMensal
  );
  const escolhida = ordenado[0];

  let motivo = "É a mais cara entre serviços que fazem a mesma coisa.";
  if (escolhida.status === "teste" && escolhida.fimTeste) {
    // Sprint 4: um teste grátis cancelado antes do fim nem chega a cobrar
    motivo = `Ainda está no teste grátis: cancelando antes de ${diaEMes(escolhida.fimTeste)}, a primeira cobrança não acontece.`;
  } else if (escolhida.usoMensal?.frequenciaUso === 0) {
    motivo = "Você não usou nenhuma vez no último mês.";
  } else if (escolhida.usoMensal?.classificacao === "prejuizo") {
    motivo = `Custo por uso alto: R$ ${escolhida.usoMensal.custoPorUso.toFixed(2).replace(".", ",")} a cada vez que você usa.`;
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

function detectarRedundancias({ agora = new Date() } = {}) {
  sincronizar(agora);
  const dataHoje = hoje(agora);
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
      gastoMensal: somarValorMensal(lista),
      assinaturas: lista.map((s) => paraApi(s, dataHoje)),
      sugestaoPausa: escolherSugestaoPausa(lista),
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
      tipos: TIPOS_POR_CATEGORIA[valor].map((tipo) => ({ valor: tipo, ...ROTULOS_TIPO[tipo] })),
    })),
    ciclos: CICLOS.map((valor) => ({ valor, ...ROTULOS_CICLO[valor] })),
    status: STATUS.map((valor) => ({ valor, rotulo: ROTULOS_STATUS[valor] })),
    limites: {
      valorMensalMaximo: VALOR_MENSAL_MAXIMO,
      nomeMaximo: NOME_MAXIMO,
      compartilhadaComMaximo: COMPARTILHADA_COM_MAXIMO,
    },
    checklist: CHECKLIST.map((item) => ({ ...item })),
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
  CATEGORIAS,
  TIPOS_POR_CATEGORIA,
  CICLOS,
  STATUS,
  TAXA_ANUAL_CDI,
  PERIODOS_MESES,
  VALOR_MENSAL_MAXIMO,
  NOME_MAXIMO,
  COMPARTILHADA_COM_MAXIMO,
  // Apenas para testes
  _resetForTests: inicializar,
};
