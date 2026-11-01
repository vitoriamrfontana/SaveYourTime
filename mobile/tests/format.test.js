import {
  formatarMoeda,
  formatarNumero,
  formatarHoras,
  formatarData,
  formatarDataHora,
  formatarQuando,
  parseValorBR,
} from '../src/utils/format';

// O Intl separa "R$" do número com espaço não separável (U+00A0)
const reais = (texto) => `R$ ${texto}`;

describe('formatarMoeda', () => {
  it('formata em reais', () => {
    expect(formatarMoeda(39.9)).toBe(reais('39,90'));
    expect(formatarMoeda(1234.5)).toBe(reais('1.234,50'));
    expect(formatarMoeda(0)).toBe(reais('0,00'));
  });

  it.each([null, undefined, NaN, Infinity, '39.9'])('mostra traço para %p em vez de quebrar', (valor) => {
    expect(formatarMoeda(valor)).toBe('—');
  });
});

describe('formatarNumero e formatarHoras', () => {
  it('usa vírgula e limita as casas', () => {
    expect(formatarNumero(1.82)).toBe('1,8');
    expect(formatarNumero(13.65, 2)).toBe('13,65');
    expect(formatarHoras(1.82)).toBe('1,8 h');
  });

  it('mostra traço sem número', () => {
    expect(formatarNumero(null)).toBe('—');
    expect(formatarHoras(undefined)).toBe('—');
  });
});

describe('formatarData', () => {
  it('formata dia sem horário sem mudar de dia pelo fuso', () => {
    expect(formatarData('2026-08-18')).toBe('18/08/2026');
    expect(formatarData('2026-08-18', { comAno: false })).toBe('18/08');
  });

  it('formata texto ISO com horário', () => {
    // Meio-dia UTC é dia 18 em qualquer fuso do Brasil
    expect(formatarData('2026-08-18T12:00:00.000Z')).toBe('18/08/2026');
  });

  it.each([null, undefined, 'abc', 20260818])('mostra traço para %p', (valor) => {
    expect(formatarData(valor)).toBe('—');
  });
});

describe('formatarQuando', () => {
  it('fala hoje, amanhã ou em quantos dias', () => {
    expect(formatarQuando(0, '2026-11-01')).toBe('hoje');
    expect(formatarQuando(1, '2026-11-02')).toBe('amanhã');
    expect(formatarQuando(5, '2026-11-06')).toBe('em 5 dias (06/11)');
  });
});

describe('formatarDataHora', () => {
  it('mostra dia, mês e hora', () => {
    expect(formatarDataHora('2026-08-18T12:00:00.000Z')).toMatch(/^18\/08 às \d{2}:\d{2}$/);
  });

  it('mostra traço para valor inválido', () => {
    expect(formatarDataHora(null)).toBe('—');
    expect(formatarDataHora('abc')).toBe('—');
  });
});

describe('parseValorBR', () => {
  it.each([
    ['39,90', 39.9],
    ['39,9', 39.9],
    ['1.234,56', 1234.56],
    ['1.234', 1234],
    ['39.90', 39.9],
    ['R$ 39,90', 39.9],
    ['  39,90  ', 39.9],
    [',5', 0.5],
    ['0', 0],
    [39.9, 39.9],
  ])('lê %p como %p', (texto, esperado) => {
    expect(parseValorBR(texto)).toBe(esperado);
  });

  it.each(['', 'abc', '39,999', '-5', '1,2,3', '12.3456', null, undefined, NaN])(
    'devolve null para %p',
    (texto) => {
      expect(parseValorBR(texto)).toBeNull();
    }
  );
});
