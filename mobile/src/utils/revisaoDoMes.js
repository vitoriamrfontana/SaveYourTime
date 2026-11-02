/**
 * revisaoDoMes - contas do resumo do "Detox do mês".
 *
 * Sprint 4: quanto as decisões da revisão liberam por mês e em horas de trabalho,
 * antes de a pessoa confirmar.
 */

export const DECISOES = { MANTER: 'manter', PAUSAR: 'pausar', CANCELAR: 'cancelar' };

// itens: os cartões da revisão (GET /review); decisoes: { [id]: 'manter' | 'pausar' | 'cancelar' }
export function resumirDecisoes(itens, decisoes, valorHora) {
  const com = (decisao) =>
    itens.filter((item) => decisoes[item.assinatura.id] === decisao).map((item) => item.assinatura);

  const pausadas = com(DECISOES.PAUSAR);
  const canceladas = com(DECISOES.CANCELAR);
  // Em centavos, para a soma não ganhar resíduo de ponto flutuante
  const centavos = [...pausadas, ...canceladas].reduce(
    (total, assinatura) => total + Math.round(assinatura.valorMensal * 100),
    0
  );
  const liberadoPorMes = centavos / 100;

  return {
    pausadas,
    canceladas,
    liberadoPorMes,
    horas: valorHora > 0 ? Math.round((liberadoPorMes / valorHora) * 10) / 10 : null,
  };
}
