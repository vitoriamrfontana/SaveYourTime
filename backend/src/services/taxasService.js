/**
 * taxasService - CDI e IPCA do Banco Central (API SGS) para as projeções do Detox.
 *
 * Sprint 4: busca com tempo limite curto e guarda o resultado por 24 h. Se o
 * Banco Central estiver fora do ar, lento ou responder algo inesperado, usa as
 * taxas de reserva e avisa com fonte "fallback". Séries conferidas em 01/11/2026:
 *   4389  = CDI anualizado, base 252 (% ao ano)
 *   13522 = IPCA acumulado em 12 meses (%)
 */

const {
  TAXA_ANUAL_CDI,
  IPCA_12M_REFERENCIA,
  DATA_TAXAS_REFERENCIA,
} = require("../models/subscriptionsModel");

const SERIES = { cdi: 4389, ipca12m: 13522 };

const TEMPO_LIMITE_MS = 3000;
const VALIDADE_MS = 24 * 60 * 60 * 1000;
// Com o Banco Central fora, tenta de novo em 10 minutos em vez de esperar o tempo
// limite em toda requisição
const VALIDADE_RESERVA_MS = 10 * 60 * 1000;

// As mesmas taxas de reserva que o model usa quando ninguém informa outra
const RESERVA = {
  cdiAnual: TAXA_ANUAL_CDI,
  ipca12m: IPCA_12M_REFERENCIA,
  fonte: "fallback",
  atualizadoEm: DATA_TAXAS_REFERENCIA,
};

let guardado = null; // { taxas, expiraEm }

function urlDaSerie(codigo) {
  return `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`;
}

// "29/10/2026" -> "2026-10-29"
function dataDoSgs(texto) {
  const partes = typeof texto === "string" ? texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/) : null;
  return partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : null;
}

// Último ponto da série em fração (13.65 -> 0.1365). Lança erro se a resposta vier
// fora do formato [{ data: "dd/MM/aaaa", valor: "13.65" }].
async function buscarSerie(codigo, fetchImpl, tempoLimiteMs) {
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), tempoLimiteMs);
  try {
    const resposta = await fetchImpl(urlDaSerie(codigo), { signal: controle.signal });
    if (!resposta.ok) throw new Error(`SGS ${codigo} respondeu ${resposta.status}`);

    const dados = await resposta.json();
    const ultimo = Array.isArray(dados) ? dados[dados.length - 1] : null;
    const valor = Number(ultimo?.valor);
    const data = dataDoSgs(ultimo?.data);
    if (!Number.isFinite(valor) || !data) throw new Error(`SGS ${codigo} respondeu fora do formato`);

    return { valor: valor / 100, data };
  } finally {
    clearTimeout(temporizador);
  }
}

// { cdiAnual, ipca12m, fonte: "bcb" | "fallback", atualizadoEm: "AAAA-MM-DD" }
async function obterTaxas({ agora = new Date(), fetchImpl = globalThis.fetch, tempoLimiteMs = TEMPO_LIMITE_MS } = {}) {
  if (guardado && guardado.expiraEm > agora.getTime()) return { ...guardado.taxas };

  let taxas;
  let validade = VALIDADE_MS;
  try {
    const [cdi, ipca] = await Promise.all([
      buscarSerie(SERIES.cdi, fetchImpl, tempoLimiteMs),
      buscarSerie(SERIES.ipca12m, fetchImpl, tempoLimiteMs),
    ]);
    // Valor absurdo também é resposta inesperada
    if (cdi.valor <= 0 || cdi.valor > 0.5 || ipca.valor < -0.2 || ipca.valor > 0.5) {
      throw new Error("Taxa do SGS fora da faixa esperada");
    }
    taxas = { cdiAnual: cdi.valor, ipca12m: ipca.valor, fonte: "bcb", atualizadoEm: cdi.data };
  } catch {
    taxas = { ...RESERVA };
    validade = VALIDADE_RESERVA_MS;
  }

  guardado = { taxas, expiraEm: agora.getTime() + validade };
  return { ...taxas };
}

module.exports = {
  obterTaxas,
  RESERVA,
  // Apenas para testes
  _limparCache: () => {
    guardado = null;
  },
};
