/**
 * listaAssinaturas - filtros e ordenações da lista do Detox.
 *
 * Sprint 4: além de categoria e valor, busca por nome, filtro por status e
 * ordenação por custo-benefício (score de eficiência) e por próxima cobrança.
 */

import { normalizarParaBusca } from './format';

export const TODAS_CATEGORIAS = 'todas';
export const TODOS_STATUS = 'todos';

export const ORDENACOES = {
  PADRAO: 'padrao',
  MAIOR_VALOR: 'maior',
  MENOR_VALOR: 'menor',
  // Sprint 4
  CUSTO_BENEFICIO: 'custo_beneficio',
  PROXIMA_COBRANCA: 'proxima_cobranca',
};

// Quem não tem o valor (sem score, sem próxima cobrança) vai para o fim
function compararComVaziosNoFim(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

const COMPARADORES = {
  [ORDENACOES.MAIOR_VALOR]: (a, b) => b.valorMensal - a.valorMensal,
  [ORDENACOES.MENOR_VALOR]: (a, b) => a.valorMensal - b.valorMensal,
  // Pior custo-benefício primeiro; empatando, a mais cara
  [ORDENACOES.CUSTO_BENEFICIO]: (a, b) =>
    compararComVaziosNoFim(a.eficiencia?.score, b.eficiencia?.score) || b.valorMensal - a.valorMensal,
  [ORDENACOES.PROXIMA_COBRANCA]: (a, b) => compararComVaziosNoFim(a.proximaCobranca, b.proximaCobranca),
};

export function filtrarEOrdenar(
  lista,
  { categoria = TODAS_CATEGORIAS, status = TODOS_STATUS, busca = '', ordenacao = ORDENACOES.PADRAO } = {}
) {
  const termo = normalizarParaBusca(busca);
  const filtradas = lista.filter(
    (s) =>
      (categoria === TODAS_CATEGORIAS || s.categoria === categoria) &&
      (status === TODOS_STATUS || s.status === status) &&
      (!termo || normalizarParaBusca(s.nome).includes(termo))
  );

  const comparar = COMPARADORES[ordenacao];
  return comparar ? [...filtradas].sort(comparar) : filtradas;
}
