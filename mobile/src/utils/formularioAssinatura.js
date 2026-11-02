/**
 * formularioAssinatura - regras do formulário de cadastro e edição do Detox.
 *
 * Sprint 4: transforma o que a pessoa digitou no corpo que a API espera e
 * aponta o erro de cada campo antes de enviar. A API continua sendo quem decide.
 */

import { formatarData, parseValorBR } from './format';
import { hojeLocal, parseDataBR } from './datas';

const NOME_MAXIMO_PADRAO = 60;

// Campos de uma assinatura existente (edição), de um item do checklist ou em branco
export function camposIniciais(assinatura, sugestao) {
  if (assinatura) {
    return {
      nome: assinatura.nome,
      valor: assinatura.valorCobrado.toFixed(2).replace('.', ','),
      ciclo: assinatura.ciclo,
      dia: assinatura.diaCobranca ? String(assinatura.diaCobranca) : '',
      proxima: assinatura.proximaCobranca ? formatarData(assinatura.proximaCobranca) : '',
      categoria: assinatura.categoria,
      tipo: assinatura.tipo,
      pessoas: assinatura.compartilhadaCom,
      emTeste: false,
      fimTeste: '',
      catalogoId: assinatura.catalogoId,
    };
  }

  return {
    nome: sugestao?.nome ?? '',
    valor: '',
    ciclo: 'mensal',
    dia: '',
    proxima: '',
    categoria: sugestao?.categoria ?? 'outros',
    tipo: sugestao?.tipo ?? null,
    pessoas: 0,
    emTeste: false,
    fimTeste: '',
    catalogoId: null,
  };
}

// Sprint 4: escolher um serviço no autocomplete preenche nome, categoria e tipo; com
// um plano (o sugerido, se nenhum for escolhido), também valor e ciclo, que seguem editáveis
export function aplicarServico(campos, servico, plano = servico.planoSugerido) {
  return {
    ...campos,
    nome: servico.nome,
    categoria: servico.categoria,
    tipo: servico.tipo,
    catalogoId: servico.id,
    ...(plano ? { valor: plano.valor.toFixed(2).replace('.', ','), ciclo: plano.ciclo } : {}),
  };
}

// Devolve { erros, dados }: o erro de cada campo (vazio = pode enviar) e o corpo da requisição
export function validarFormulario(
  campos,
  { editando = false, nomeMaximo = NOME_MAXIMO_PADRAO, hoje = hojeLocal() } = {}
) {
  const erros = {};

  const nome = campos.nome.trim();
  if (!nome) erros.nome = 'Informe o nome.';
  else if (nome.length > nomeMaximo) erros.nome = `Use no máximo ${nomeMaximo} caracteres.`;

  const valorCobrado = parseValorBR(campos.valor);
  if (valorCobrado === null) erros.valor = 'Informe o valor, por exemplo 39,90.';
  else if (valorCobrado <= 0) erros.valor = 'O valor precisa ser maior que zero.';

  const dados = {
    nome,
    valorCobrado,
    ciclo: campos.ciclo,
    categoria: campos.categoria,
    tipo: campos.tipo,
    compartilhadaCom: campos.pessoas,
  };

  // No mensal basta o dia; nos outros ciclos é preciso a data da próxima cobrança
  if (campos.ciclo === 'mensal' && campos.dia.trim()) {
    const dia = Number(campos.dia);
    if (Number.isInteger(dia) && dia >= 1 && dia <= 31) dados.diaCobranca = dia;
    else erros.dia = 'Use um dia entre 1 e 31.';
  } else if (campos.ciclo !== 'mensal' && campos.proxima.trim()) {
    const proxima = parseDataBR(campos.proxima);
    if (proxima) dados.proximaCobranca = proxima;
    else erros.proxima = 'Use o formato DD/MM/AAAA.';
  }

  // Sprint 4: o serviço do catálogo só vai no cadastro (a edição não troca de serviço)
  if (!editando && campos.catalogoId) dados.catalogoId = campos.catalogoId;

  // O teste grátis só se informa no cadastro
  if (!editando && campos.emTeste) {
    const fimTeste = parseDataBR(campos.fimTeste);
    if (!fimTeste) erros.fimTeste = 'Use o formato DD/MM/AAAA.';
    else if (fimTeste <= hoje) erros.fimTeste = 'A data precisa ser depois de hoje.';
    else Object.assign(dados, { status: 'teste', fimTeste });
  }

  return { erros, dados };
}
