/**
 * format - formatação e leitura de valores na interface (pt-BR).
 *
 * Sprint 4 (Detox): substitui as cópias de formatarMoeda que cada componente
 * tinha e que derrubavam a tela ao receber null ou undefined.
 */

const SEM_VALOR = '—';

function ehNumero(valor) {
  return typeof valor === 'number' && Number.isFinite(valor);
}

export function formatarMoeda(valor) {
  if (!ehNumero(valor)) return SEM_VALOR;
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarNumero(valor, casas = 1) {
  if (!ehNumero(valor)) return SEM_VALOR;
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

// 1.82 -> "1,8 h"
export function formatarHoras(horas) {
  if (!ehNumero(horas)) return SEM_VALOR;
  return `${formatarNumero(horas, 1)} h`;
}

// "2026-08-18" (dia sem horário) -> "18/08/2026" sem passar por Date, para o fuso
// não mudar o dia. Texto ISO com horário -> o dia no fuso do aparelho.
export function formatarData(valor, { comAno = true } = {}) {
  if (typeof valor !== 'string') return SEM_VALOR;

  const soData = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (soData) {
    const [, ano, mes, dia] = soData;
    return comAno ? `${dia}/${mes}/${ano}` : `${dia}/${mes}`;
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return SEM_VALOR;
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    ...(comAno ? { year: 'numeric' } : {}),
  });
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// "2026-11" -> "nov/2026" (mês em que um preço de referência foi conferido)
export function formatarMesAno(valor) {
  const partes = typeof valor === 'string' ? valor.match(/^(\d{4})-(\d{2})$/) : null;
  if (!partes) return SEM_VALOR;
  return `${MESES_CURTOS[Number(partes[2]) - 1]}/${partes[1]}`;
}

// Para buscar por nome sem ligar para maiúsculas e acentos ("Música" acha "musica")
export function normalizarParaBusca(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .trim();
}

// A partir dos dias que faltam: "hoje", "amanhã" ou "em 3 dias (08/11)"
export function formatarQuando(diasRestantes, data) {
  if (diasRestantes === 0) return 'hoje';
  if (diasRestantes === 1) return 'amanhã';
  return `em ${diasRestantes} dias (${formatarData(data, { comAno: false })})`;
}

// "2026-08-18T17:30:00Z" -> "18/08 às 14:30" (no fuso do aparelho)
export function formatarDataHora(iso) {
  if (typeof iso !== 'string') return SEM_VALOR;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return SEM_VALOR;

  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} às ${hora}`;
}

// Lê o que a pessoa digitou: o teclado decimal-pad em pt-BR usa vírgula.
// "39,90" -> 39.9 | "1.234,56" -> 1234.56 | "39.90" -> 39.9 | inválido -> null
export function parseValorBR(texto) {
  if (ehNumero(texto)) return texto;
  if (typeof texto !== 'string') return null;

  let limpo = texto.replace(/R\$/g, '').replace(/\s/g, '');
  if (limpo.includes(',')) {
    // A vírgula é o decimal; pontos antes dela separam milhar
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // Só pontos agrupando de 3 em 3 ("1.234"): é milhar, não decimal
    limpo = limpo.replace(/\./g, '');
  }
  if (limpo.startsWith('.')) limpo = `0${limpo}`;

  return /^\d+(\.\d{1,2})?$/.test(limpo) ? Number(limpo) : null;
}
