import { filtrarEOrdenar, ORDENACOES, TODOS_STATUS } from '../src/utils/listaAssinaturas';

const LISTA = [
  { id: 1, nome: 'Música', categoria: 'streaming', status: 'ativa', valorMensal: 21.9, proximaCobranca: '2026-11-20', eficiencia: { score: 85 } },
  { id: 2, nome: 'Filmes', categoria: 'streaming', status: 'ativa', valorMensal: 39.9, proximaCobranca: '2026-11-03', eficiencia: { score: 61 } },
  { id: 3, nome: 'Academia', categoria: 'saude', status: 'cancelada', valorMensal: 49.9, proximaCobranca: null, eficiencia: null },
  { id: 4, nome: 'Séries', categoria: 'streaming', status: 'pausada', valorMensal: 34.9, proximaCobranca: '2026-12-05', eficiencia: null },
  { id: 5, nome: 'Tarifa', categoria: 'financeiro', status: 'ativa', valorMensal: 19.9, proximaCobranca: null, eficiencia: { score: 61 } },
];

const ids = (lista) => lista.map((s) => s.id);

describe('filtrarEOrdenar', () => {
  it('sem filtros, devolve tudo na ordem de cadastro', () => {
    expect(ids(filtrarEOrdenar(LISTA))).toEqual([1, 2, 3, 4, 5]);
  });

  it('filtra por categoria, status e nome (sem ligar para acentos)', () => {
    expect(ids(filtrarEOrdenar(LISTA, { categoria: 'streaming' }))).toEqual([1, 2, 4]);
    expect(ids(filtrarEOrdenar(LISTA, { status: 'ativa' }))).toEqual([1, 2, 5]);
    expect(ids(filtrarEOrdenar(LISTA, { status: TODOS_STATUS, busca: 'musi' }))).toEqual([1]);
    expect(ids(filtrarEOrdenar(LISTA, { busca: 'SÉR' }))).toEqual([4]);
  });

  it('ordena por valor', () => {
    expect(ids(filtrarEOrdenar(LISTA, { ordenacao: ORDENACOES.MAIOR_VALOR }))).toEqual([3, 2, 4, 1, 5]);
    expect(ids(filtrarEOrdenar(LISTA, { ordenacao: ORDENACOES.MENOR_VALOR }))).toEqual([5, 1, 4, 2, 3]);
  });

  it('custo-benefício: menor score primeiro, empate pela mais cara, sem score no fim', () => {
    expect(ids(filtrarEOrdenar(LISTA, { ordenacao: ORDENACOES.CUSTO_BENEFICIO }))).toEqual([2, 5, 1, 3, 4]);
  });

  it('próxima cobrança: a mais perto primeiro, sem data no fim', () => {
    expect(ids(filtrarEOrdenar(LISTA, { ordenacao: ORDENACOES.PROXIMA_COBRANCA }))).toEqual([2, 1, 4, 3, 5]);
  });

  it('não altera a lista recebida', () => {
    filtrarEOrdenar(LISTA, { ordenacao: ORDENACOES.MAIOR_VALOR });
    expect(ids(LISTA)).toEqual([1, 2, 3, 4, 5]);
  });
});
