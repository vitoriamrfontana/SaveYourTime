/**
 * MODEL - Gestão Orçamentária dos 3 Potes (50-30-20)
 *
 * Os dados são mantidos em memória, seguindo o padrão atual do projeto (MVP,
 * sem banco de dados). O model concentra estado, cálculos de orçamento,
 * burn rate e alertas de teto.
 */

const UserModel = require('./userModel');

const CATEGORIAS = {
  sobrevivencia: {
    chave: 'sobrevivencia',
    nome: 'Necessidades',
    percentual: 0.5,
    tipoMeta: 'teto',
  },
  estiloVida: {
    chave: 'estiloVida',
    nome: 'Estilo de Vida',
    percentual: 0.3,
    tipoMeta: 'teto',
  },
  dividas: {
    chave: 'dividas',
    nome: 'Dívidas / Investimentos',
    percentual: 0.2,
    // Na regra 50-30-20, 50% e 30% são tetos de gasto; os 20% são um piso
    // (quanto o usuário deve destinar à reserva / quitação de dívidas).
    tipoMeta: 'piso',
  },
};

// Pote que recebe as sobras no reequilíbrio (reserva de segurança).
const POTE_RESERVA = 'dividas';

// Folga, em pontos percentuais do salário, tolerada no diagnóstico mensal.
const TOLERANCIA_PP = 0.5;

let lancamentos = [];
let proximoId = 1;

// Fechamento de competência e reequilíbrio (também em memória, como o restante).
let fechamentos = {};
let ajustesPorMes = {};
let transferencias = [];
let proximoIdTransferencia = 1;

function arredondar(valor) {
  return Number(Number(valor || 0).toFixed(2));
}

function validarCategoria(categoria) {
  if (!CATEGORIAS[categoria]) {
    throw new Error(`Categoria inválida. Use: ${Object.keys(CATEGORIAS).join(', ')}.`);
  }
}

function validarValor(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) {
    throw new Error('O valor do lançamento deve ser maior que zero.');
  }
  return arredondar(numero);
}

function normalizarData(data) {
  if (!data) {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
  }

  const texto = String(data).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new Error('A data deve estar no formato AAAA-MM-DD.');
  }

  const [ano, mes, dia] = texto.split('-').map(Number);
  const dataLocal = new Date(ano, mes - 1, dia);
  if (
    dataLocal.getFullYear() !== ano ||
    dataLocal.getMonth() !== mes - 1 ||
    dataLocal.getDate() !== dia
  ) {
    throw new Error('Data inválida.');
  }

  return texto;
}

function mesValido(mes) {
  return /^\d{4}-\d{2}$/.test(mes);
}

function obterMesAtual() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

function obterInformacoesMes(mes) {
  if (!mesValido(mes)) {
    throw new Error('O mês deve estar no formato AAAA-MM.');
  }

  const [ano, numeroMes] = mes.split('-').map(Number);
  if (numeroMes < 1 || numeroMes > 12) {
    throw new Error('Mês inválido.');
  }

  const diasNoMes = new Date(ano, numeroMes, 0).getDate();
  const mesAtual = obterMesAtual();
  const agora = new Date();

  const diasDecorridos = mes === mesAtual
    ? agora.getDate()
    : new Date(ano, numeroMes, 0).getDate();

  return {
    ano,
    numeroMes,
    diasNoMes,
    diasDecorridos,
    mesAtual,
  };
}

function filtrarLancamentosDoMes(mes) {
  return lancamentos.filter((lancamento) => lancamento.data.slice(0, 7) === mes);
}

function calcularStatusAlerta(percentual) {
  if (percentual > 100) return 'estourado';
  if (percentual >= 80) return 'atencao';
  return 'normal';
}

function calcularBurnRate(totalGasto, diasDecorridos) {
  if (totalGasto <= 0 || diasDecorridos <= 0) return 0;
  return arredondar(totalGasto / diasDecorridos);
}

function calcularProjecaoDia(limite, gasto, burnRate, diasNoMes, diasDecorridos) {
  if (gasto >= limite) return diasDecorridos;
  if (burnRate <= 0) return null;

  const diasParaEsgotar = Math.ceil((limite - gasto) / burnRate);
  const diaProjetado = diasDecorridos + diasParaEsgotar;

  return diaProjetado <= diasNoMes ? diaProjetado : null;
}

function criarResumoPote(config, salario, lancamentosMes, diasNoMes, diasDecorridos, ajuste = 0) {
  // `ajuste` vem de reequilíbrios: reduz o teto do pote de origem e aumenta o da reserva.
  const limite = arredondar(salario * config.percentual + ajuste);
  const gastosCategoria = lancamentosMes
    .filter((lancamento) => lancamento.categoria === config.chave)
    .sort((a, b) => a.data.localeCompare(b.data) || b.id - a.id);

  const gastoAtual = arredondar(
    gastosCategoria.reduce((total, lancamento) => total + lancamento.valor, 0)
  );
  const saldo = arredondar(limite - gastoAtual);
  const percentualTeto = limite > 0 ? arredondar((gastoAtual / limite) * 100) : 0;
  const percentualVisual = Math.min(percentualTeto, 100);
  const burnRateDiario = calcularBurnRate(gastoAtual, diasDecorridos);
  const projecaoDia = calcularProjecaoDia(
    limite,
    gastoAtual,
    burnRateDiario,
    diasNoMes,
    diasDecorridos
  );

  return {
    chave: config.chave,
    nome: config.nome,
    percentualOrcamento: config.percentual * 100,
    limite,
    ajusteReequilibrio: arredondar(ajuste),
    gastoAtual,
    saldo,
    percentualTeto,
    percentualVisual,
    burnRateDiario,
    projecaoDia,
    statusAlerta: calcularStatusAlerta(percentualTeto),
    alerta: {
      status: calcularStatusAlerta(percentualTeto),
      percentualTeto,
      limiteExcedido: percentualTeto > 100,
    },
    estourado: percentualTeto > 100,
    transacoes: gastosCategoria,
  };
}

function calcularResumo(mes = obterMesAtual()) {
  const { diasNoMes, diasDecorridos, mesAtual } = obterInformacoesMes(mes);
  const salario = arredondar(UserModel.getProfile().salario);
  const lancamentosMes = filtrarLancamentosDoMes(mes);

  const ajustes = ajustesPorMes[mes] || {};
  const pots = Object.values(CATEGORIAS).map((config) =>
    criarResumoPote(config, salario, lancamentosMes, diasNoMes, diasDecorridos, ajustes[config.chave] || 0)
  );

  const totalGasto = arredondar(
    lancamentosMes.reduce((total, lancamento) => total + lancamento.valor, 0)
  );

  return {
    mes,
    mesAtual,
    salario,
    diasNoMes,
    diasDecorridos,
    totalGasto,
    fechado: Boolean(fechamentos[mes]),
    pots,
    // Mantido para compatibilidade com telas/integrações que esperam os nomes legados.
    limites: Object.fromEntries(pots.map((pote) => [pote.chave, pote.limite])),
    atual: Object.fromEntries(pots.map((pote) => [pote.chave, pote.gastoAtual])),
  };
}

function listarLancamentos(mes = obterMesAtual(), categoria) {
  const lista = filtrarLancamentosDoMes(mes)
    .filter((lancamento) => !categoria || lancamento.categoria === categoria)
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);

  return lista.map((item) => ({ ...item }));
}

function adicionarLancamento({ categoria, valor, descricao, data }) {
  validarCategoria(categoria);
  const valorNormalizado = validarValor(valor);
  const dataNormalizada = normalizarData(data);
  const descricaoNormalizada = String(descricao || '').trim();

  if (!descricaoNormalizada) {
    throw new Error('A descrição do lançamento é obrigatória.');
  }

  const novoLancamento = {
    id: proximoId++,
    categoria,
    valor: valorNormalizado,
    descricao: descricaoNormalizada,
    data: dataNormalizada,
  };

  lancamentos.push(novoLancamento);
  return { ...novoLancamento };
}

function removerLancamento(id) {
  const numeroId = Number(id);
  const indice = lancamentos.findIndex((lancamento) => lancamento.id === numeroId);

  if (indice === -1) return null;
  const [removido] = lancamentos.splice(indice, 1);
  return { ...removido };
}


function verificarImpactoCompra({ valor, categoria, mes = obterMesAtual() }) {
  validarCategoria(categoria);
  const valorCompra = validarValor(valor);
  const resumo = calcularResumo(mes);
  const poteSelecionado = resumo.pots.find((pote) => pote.chave === categoria);

  const pots = resumo.pots.map((pote) => {
    const compraNestePote = pote.chave === categoria ? valorCompra : 0;
    const gastoProjetado = arredondar(pote.gastoAtual + compraNestePote);
    const saldoProjetado = arredondar(pote.limite - gastoProjetado);
    const percentualProjetado = pote.limite > 0
      ? arredondar((gastoProjetado / pote.limite) * 100)
      : (gastoProjetado > 0 ? 100 : 0);

    return {
      chave: pote.chave,
      nome: pote.nome,
      percentualOrcamento: pote.percentualOrcamento,
      limite: pote.limite,
      gastoAtual: pote.gastoAtual,
      saldoAtual: pote.saldo,
      percentualAtual: pote.percentualTeto,
      gastoProjetado,
      saldoProjetado,
      percentualProjetado,
      percentualVisualProjetado: Math.min(Math.max(percentualProjetado, 0), 100),
      afetado: pote.chave === categoria,
    };
  });

  const projetado = pots.find((pote) => pote.chave === categoria);
  let parecer;
  let status;
  let mensagem;

  if (projetado.gastoProjetado > projetado.limite) {
    status = 'violacao';
    parecer = 'Violação de Teto Orçamentário';
    mensagem = `Esta compra ultrapassaria o teto de ${projetado.nome} em ${arredondar(Math.abs(projetado.saldoProjetado)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
  } else if (projetado.limite > 0 && projetado.percentualProjetado >= 90) {
    status = 'atencao';
    parecer = 'Atenção - Margem Estreita';
    mensagem = `A compra cabe no orçamento, mas deixaria apenas ${arredondar(projetado.saldoProjetado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} disponíveis neste pote.`;
  } else {
    status = 'liberada';
    parecer = 'Compra Liberada';
    mensagem = `A compra cabe no teto de ${projetado.nome} e manteria uma margem confortável neste mês.`;
  }

  return {
    categoria,
    categoriaNome: poteSelecionado.nome,
    valor: valorCompra,
    mes: resumo.mes,
    status,
    parecer,
    mensagem,
    limite: projetado.limite,
    gastoAtual: projetado.gastoAtual,
    saldoAtual: projetado.saldoAtual,
    gastoProjetado: projetado.gastoProjetado,
    saldoProjetado: projetado.saldoProjetado,
    percentualProjetado: projetado.percentualProjetado,
    pots,
  };
}

// ---------------------------------------------------------------------------
// Fechamento de competência mensal, diagnóstico 50-30-20 e reequilíbrio
// ---------------------------------------------------------------------------

function copiar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function resolverMesFechamento(mes) {
  const mesNormalizado = mes ? String(mes).trim() : obterMesAtual();
  const { mesAtual } = obterInformacoesMes(mesNormalizado);

  if (mesNormalizado > mesAtual) {
    throw new Error('Não é possível fechar a competência de um mês futuro.');
  }

  return mesNormalizado;
}

function medalhaPorConformidade(conformes, totalPotes) {
  if (conformes === totalPotes) {
    return {
      nivel: 'ouro',
      titulo: 'Orçamento impecável',
      mensagem: 'Você manteve 50-30-20 perfeitamente este mês!',
    };
  }
  if (conformes === totalPotes - 1) {
    return {
      nivel: 'prata',
      titulo: 'Quase lá',
      mensagem: `Quase lá! ${conformes} de ${totalPotes} potes ficaram dentro da regra 50-30-20.`,
    };
  }
  if (conformes >= 1) {
    return {
      nivel: 'bronze',
      titulo: 'Em evolução',
      mensagem: `Apenas ${conformes} de ${totalPotes} potes ficaram dentro da regra 50-30-20. Reequilibrar ajuda a corrigir o rumo.`,
    };
  }
  return {
    nivel: 'nenhuma',
    titulo: 'Hora de recomeçar',
    mensagem: 'Nenhum pote ficou dentro da regra 50-30-20 neste mês. No próximo, comece pelos tetos.',
  };
}

/**
 * Diagnóstico do desvio percentual da regra 50-30-20 para um mês.
 * - Necessidades e Estilo de Vida são tetos: o desvio só é ruim se o gasto passar da meta.
 * - Dívidas/Investimentos é piso: o desvio é ruim se o valor destinado ficar abaixo da meta.
 *   Sobras transferidas por reequilíbrio contam como valor destinado à reserva.
 * O desvio é medido em pontos percentuais do salário (real% - meta%).
 */
function diagnosticarDesvio(mes) {
  const resumo = calcularResumo(mes);
  const { salario } = resumo;

  if (!(salario > 0)) {
    throw new Error('Defina um salário no perfil para diagnosticar a regra 50-30-20.');
  }

  const potes = resumo.pots.map((pote) => {
    const config = CATEGORIAS[pote.chave];
    const metaPercentual = config.percentual * 100;
    const metaValor = arredondar(salario * config.percentual);
    const recebido = config.tipoMeta === 'piso' ? Math.max(pote.ajusteReequilibrio, 0) : 0;
    const alocado = arredondar(pote.gastoAtual + recebido);
    const realPercentual = arredondar((alocado / salario) * 100);
    const desvio = arredondar(realPercentual - metaPercentual);

    const conforme = config.tipoMeta === 'teto'
      ? desvio <= TOLERANCIA_PP
      : desvio >= -TOLERANCIA_PP;

    let situacao = 'dentro';
    if (!conforme) situacao = config.tipoMeta === 'teto' ? 'acima' : 'abaixo';

    const desvioAdverso = config.tipoMeta === 'teto' ? Math.max(desvio, 0) : Math.max(-desvio, 0);

    return {
      chave: pote.chave,
      nome: pote.nome,
      tipoMeta: config.tipoMeta,
      metaPercentual,
      metaValor,
      limite: pote.limite,
      gasto: pote.gastoAtual,
      alocado,
      realPercentual,
      desvioPontosPercentuais: desvio,
      desvioAdverso: arredondar(desvioAdverso),
      conforme,
      situacao,
      sobra: config.tipoMeta === 'teto' ? arredondar(Math.max(pote.limite - pote.gastoAtual, 0)) : 0,
    };
  });

  const conformes = potes.filter((pote) => pote.conforme).length;
  const desvioTotal = potes.reduce((total, pote) => total + pote.desvioAdverso, 0);
  const reserva = potes.find((pote) => pote.chave === POTE_RESERVA);
  const sobras = potes.filter((pote) => pote.sobra > 0).map((pote) => ({
    chave: pote.chave,
    nome: pote.nome,
    valor: pote.sobra,
  }));
  const sobraEstiloVida = potes.find((pote) => pote.chave === 'estiloVida').sobra;

  return {
    mes,
    salario,
    totalGasto: resumo.totalGasto,
    parcial: mes === resumo.mesAtual,
    potes,
    conformes,
    totalPotes: potes.length,
    conforme: conformes === potes.length,
    aderencia: arredondar(Math.max(0, 100 - desvioTotal)),
    medalha: medalhaPorConformidade(conformes, potes.length),
    sobras,
    deficitReserva: arredondar(Math.max(reserva.metaValor - reserva.alocado, 0)),
    sugestaoReequilibrio: sobraEstiloVida > 0
      ? { origem: 'estiloVida', destino: POTE_RESERVA, valor: sobraEstiloVida }
      : null,
  };
}

function montarFechamento(mes, fechadoEm) {
  const diagnostico = diagnosticarDesvio(mes);
  const transferenciasMes = transferencias.filter((item) => item.mes === mes);

  return {
    ...diagnostico,
    fechadoEm,
    atualizadoEm: new Date().toISOString(),
    transferencias: transferenciasMes.map((item) => ({ ...item })),
    totalTransferido: arredondar(transferenciasMes.reduce((total, item) => total + item.valor, 0)),
  };
}

/**
 * Fecha a competência de um mês (padrão: mês atual): congela um diagnóstico
 * 50-30-20 no histórico. Fechar de novo o mesmo mês recalcula o diagnóstico,
 * preservando as transferências já feitas.
 */
function fecharCompetenciaMensal(mes) {
  const mesFechamento = resolverMesFechamento(mes);

  if (!filtrarLancamentosDoMes(mesFechamento).length) {
    throw new Error('Não há lançamentos neste mês para fechar a competência.');
  }

  const fechadoEm = fechamentos[mesFechamento]?.fechadoEm || new Date().toISOString();
  const fechamento = montarFechamento(mesFechamento, fechadoEm);
  fechamentos[mesFechamento] = fechamento;

  return copiar(fechamento);
}

function listarFechamentos() {
  return Object.values(fechamentos)
    .sort((a, b) => b.mes.localeCompare(a.mes))
    .map(copiar);
}

/**
 * Transfere sobras de um pote de teto (padrão: Estilo de Vida) para a reserva
 * de segurança. A transferência ajusta os tetos do mês (origem diminui,
 * reserva aumenta) e atualiza o fechamento. Sem `valor`, move a sobra inteira.
 */
function reequilibrarPotes({ mes, origem = 'estiloVida', destino = POTE_RESERVA, valor } = {}) {
  const mesFechamento = resolverMesFechamento(mes);

  validarCategoria(origem);
  validarCategoria(destino);

  if (CATEGORIAS[origem].tipoMeta !== 'teto') {
    throw new Error('Só é possível transferir sobras de potes com teto (Necessidades ou Estilo de Vida).');
  }
  if (destino !== POTE_RESERVA) {
    throw new Error('As sobras só podem ser transferidas para a reserva (Dívidas / Investimentos).');
  }

  const fechamentoAtual = fechamentos[mesFechamento];
  if (!fechamentoAtual) {
    throw new Error('Feche a competência do mês antes de reequilibrar as sobras.');
  }

  const poteOrigem = diagnosticarDesvio(mesFechamento).potes.find((pote) => pote.chave === origem);
  const sobra = poteOrigem.sobra;

  if (sobra <= 0) {
    throw new Error(`Não há sobras em ${poteOrigem.nome} para transferir.`);
  }

  const semValor = valor === undefined || valor === null || valor === '';
  const valorTransferido = semValor ? sobra : validarValor(valor);

  if (valorTransferido > sobra) {
    throw new Error(`O valor excede a sobra disponível em ${poteOrigem.nome} (${sobra.toFixed(2)}).`);
  }

  const ajustes = ajustesPorMes[mesFechamento] || (ajustesPorMes[mesFechamento] = {});
  ajustes[origem] = arredondar((ajustes[origem] || 0) - valorTransferido);
  ajustes[destino] = arredondar((ajustes[destino] || 0) + valorTransferido);

  const transferencia = {
    id: proximoIdTransferencia++,
    mes: mesFechamento,
    origem,
    destino,
    valor: valorTransferido,
    criadaEm: new Date().toISOString(),
  };
  transferencias.push(transferencia);

  const fechamento = montarFechamento(mesFechamento, fechamentoAtual.fechadoEm);
  fechamentos[mesFechamento] = fechamento;

  return {
    transferencia: { ...transferencia },
    fechamento: copiar(fechamento),
    resumo: calcularResumo(mesFechamento),
  };
}

function resetar() {
  lancamentos = [];
  proximoId = 1;
  fechamentos = {};
  ajustesPorMes = {};
  transferencias = [];
  proximoIdTransferencia = 1;
}

module.exports = {
  CATEGORIAS,
  getResumo: calcularResumo,
  verificarImpactoCompra,
  listarLancamentos,
  adicionarLancamento,
  removerLancamento,
  diagnosticarDesvio,
  fecharCompetenciaMensal,
  listarFechamentos,
  reequilibrarPotes,
  resetar,
};
