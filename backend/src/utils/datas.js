/**
 * datas - datas sem horário ("AAAA-MM-DD") no fuso de São Paulo.
 *
 * Sprint 4 (Detox): cobrança acontece num dia, não num instante. Trabalhar com
 * o texto "AAAA-MM-DD" evita o erro clássico de new Date("2026-10-31"), que é
 * meia-noite UTC e vira dia 30 no horário de Brasília. Textos nesse formato
 * podem ser comparados direto com < e >, porque a ordem alfabética é a cronológica.
 */

const FUSO_PADRAO = "America/Sao_Paulo";
const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Criar um Intl.DateTimeFormat é caro: guarda um por fuso
const formatadores = {};

function formatador(fuso) {
  if (!formatadores[fuso]) {
    formatadores[fuso] = new Intl.DateTimeFormat("pt-BR", {
      timeZone: fuso,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
  return formatadores[fuso];
}

// Instante (Date ou texto ISO) -> dia "AAAA-MM-DD" no fuso informado
function paraDataLocal(instante, fuso = FUSO_PADRAO) {
  const partes = formatador(fuso).formatToParts(new Date(instante));
  const parte = (tipo) => partes.find((p) => p.type === tipo).value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

function hoje(agora = new Date(), fuso = FUSO_PADRAO) {
  return paraDataLocal(agora, fuso);
}

// mes de 1 a 12
function ultimoDiaDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

// Soma meses mantendo o dia preferido. Em mês curto, cai no último dia
// (31/01 + 1 mês = 28/02 ou 29/02), sem "encolher" o dia dos meses seguintes.
function adicionarMeses(data, meses, diaPreferido = Number(data.slice(8, 10))) {
  const [ano, mes] = data.split("-").map(Number);
  const indiceMes = ano * 12 + (mes - 1) + meses;
  const novoAno = Math.floor(indiceMes / 12);
  const novoMes = (indiceMes % 12) + 1;
  const dia = Math.min(diaPreferido, ultimoDiaDoMes(novoAno, novoMes));

  return `${novoAno}-${String(novoMes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// "AAAA-MM-DD" <-> milissegundos da meia-noite UTC daquele dia (só para fazer contas)
function paraUtc(data) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function deUtc(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function adicionarDias(data, dias) {
  return deUtc(paraUtc(data) + dias * MS_POR_DIA);
}

// Quantos dias de "de" até "ate" (negativo se "ate" vier antes)
function diasEntre(de, ate) {
  return Math.round((paraUtc(ate) - paraUtc(de)) / MS_POR_DIA);
}

// "AAAA-MM-DD" de um dia que existe (recusa 2026-02-30)
function ehDataValida(texto) {
  if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  return deUtc(paraUtc(texto)) === texto;
}

// Instante da meia-noite do dia em Brasília. O deslocamento é fixo em -03:00
// porque o Brasil não tem horário de verão desde 2019.
function inicioDoDia(data) {
  return new Date(`${data}T00:00:00-03:00`).toISOString();
}

module.exports = {
  paraDataLocal,
  hoje,
  ultimoDiaDoMes,
  adicionarMeses,
  adicionarDias,
  diasEntre,
  ehDataValida,
  inicioDoDia,
};
