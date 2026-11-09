/**
 * datas - datas sem horário ("AAAA-MM-DD") no fuso do aparelho.
 *
 * Sprint 4 (Detox): o formulário e os avisos mostram datas de cobrança, de fim
 * do teste grátis e de volta da pausa. Quem valida de verdade é a API.
 */

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

export function hojeLocal(agora = new Date()) {
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;
}

export function adicionarDias(data, dias) {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

// Em mês curto, cai no último dia (31/01 + 1 mês = 28/02 ou 29/02)
export function adicionarMeses(data, meses) {
  const [ano, mes, dia] = data.split('-').map(Number);
  const indiceMes = ano * 12 + (mes - 1) + meses;
  const novoAno = Math.floor(indiceMes / 12);
  const novoMes = (indiceMes % 12) + 1;
  const ultimoDia = new Date(Date.UTC(novoAno, novoMes, 0)).getUTCDate();
  return `${novoAno}-${doisDigitos(novoMes)}-${doisDigitos(Math.min(dia, ultimoDia))}`;
}

// "08/11/2026" -> "2026-11-08". Data que não existe (31/02) ou fora do formato -> null
export function parseDataBR(texto) {
  const partes = typeof texto === 'string' ? texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/) : null;
  if (!partes) return null;

  const [, dia, mes, ano] = partes;
  const data = `${ano}-${mes}-${dia}`;
  return adicionarDias(data, 0) === data ? data : null;
}
