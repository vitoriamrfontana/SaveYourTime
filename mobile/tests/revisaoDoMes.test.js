import { DECISOES, resumirDecisoes } from '../src/utils/revisaoDoMes';

const ITENS = [
  { assinatura: { id: 1, nome: 'Filmes', valorMensal: 39.9 } },
  { assinatura: { id: 2, nome: 'Séries', valorMensal: 34.9 } },
  { assinatura: { id: 3, nome: 'Música', valorMensal: 21.9 } },
];

describe('resumirDecisoes', () => {
  it('soma o que foi pausado ou cancelado e converte em horas', () => {
    const resumo = resumirDecisoes(
      ITENS,
      { 1: DECISOES.PAUSAR, 2: DECISOES.CANCELAR, 3: DECISOES.MANTER },
      20
    );

    expect(resumo.liberadoPorMes).toBe(74.8);
    expect(resumo.horas).toBe(3.7);
    expect(resumo.pausadas.map((s) => s.nome)).toEqual(['Filmes']);
    expect(resumo.canceladas.map((s) => s.nome)).toEqual(['Séries']);
  });

  it('sem decisões, não libera nada', () => {
    expect(resumirDecisoes(ITENS, {}, 20)).toMatchObject({ liberadoPorMes: 0, horas: 0 });
  });

  it('sem valor-hora, as horas ficam nulas', () => {
    expect(resumirDecisoes(ITENS, { 1: DECISOES.CANCELAR }, null).horas).toBeNull();
  });
});
