import { adicionarDias, adicionarMeses, hojeLocal, parseDataBR } from '../src/utils/datas';

describe('hojeLocal', () => {
  it('usa a data do aparelho, sem passar por UTC', () => {
    expect(hojeLocal(new Date(2026, 10, 1, 23, 30))).toBe('2026-11-01');
  });
});

describe('adicionarDias', () => {
  it('atravessa mês e ano', () => {
    expect(adicionarDias('2026-12-30', 3)).toBe('2027-01-02');
    expect(adicionarDias('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('adicionarMeses', () => {
  it.each([
    ['2026-01-31', 1, '2026-02-28'],
    ['2028-01-31', 1, '2028-02-29'],
    ['2026-03-31', 1, '2026-04-30'],
    ['2026-11-15', 3, '2027-02-15'],
  ])('%s + %i mês(es) = %s', (data, meses, esperado) => {
    expect(adicionarMeses(data, meses)).toBe(esperado);
  });
});

describe('parseDataBR', () => {
  it('converte DD/MM/AAAA para AAAA-MM-DD', () => {
    expect(parseDataBR('08/11/2026')).toBe('2026-11-08');
    expect(parseDataBR(' 29/02/2028 ')).toBe('2028-02-29');
  });

  it.each(['31/02/2026', '29/02/2027', '2026-11-08', '8/11/2026', '', null])('devolve null para %p', (texto) => {
    expect(parseDataBR(texto)).toBeNull();
  });
});
