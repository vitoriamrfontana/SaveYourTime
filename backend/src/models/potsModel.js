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
  },
  estiloVida: {
    chave: 'estiloVida',
    nome: 'Estilo de Vida',
    percentual: 0.3,
  },
  dividas: {
    chave: 'dividas',
    nome: 'Dívidas / Investimentos',
    percentual: 0.2,
  },
};

let lancamentos = [];
let proximoId = 1;

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

function criarResumoPote(config, salario, lancamentosMes, diasNoMes, diasDecorridos) {
  const limite = arredondar(salario * config.percentual);
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

  const pots = Object.values(CATEGORIAS).map((config) =>
    criarResumoPote(config, salario, lancamentosMes, diasNoMes, diasDecorridos)
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

function resetar() {
  lancamentos = [];
  proximoId = 1;
}

module.exports = {
  CATEGORIAS,
  getResumo: calcularResumo,
  listarLancamentos,
  adicionarLancamento,
  removerLancamento,
  resetar,
};
