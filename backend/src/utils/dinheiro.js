/**
 * dinheiro - arredondamento e contas com valores em reais.
 *
 * Sprint 4 (Detox): a API continua em reais com 2 casas (contrato), mas em
 * ponto flutuante 0.1 + 0.2 dá 0.30000000000000004. Aqui somas e
 * multiplicações são feitas em centavos inteiros e só voltam para reais no fim.
 */

function paraCentavos(valor) {
  return Math.round(Number(valor) * 100);
}

function arredondar(valor) {
  return paraCentavos(valor) / 100;
}

function somar(valores) {
  return valores.reduce((total, valor) => total + paraCentavos(valor), 0) / 100;
}

// Ex.: mensalidade x 12 meses
function multiplicar(valor, fator) {
  return Math.round(paraCentavos(valor) * fator) / 100;
}

module.exports = { arredondar, somar, multiplicar };
