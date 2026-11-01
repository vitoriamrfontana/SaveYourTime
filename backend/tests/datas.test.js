const {
  paraDataLocal,
  hoje,
  ultimoDiaDoMes,
  adicionarMeses,
  adicionarDias,
  diasEntre,
  ehDataValida,
  inicioDoDia,
} = require("../src/utils/datas");

describe("datas.paraDataLocal", () => {
  it("converte o instante para o dia em Brasília", () => {
    expect(paraDataLocal("2026-11-01T02:30:00.000Z")).toBe("2026-10-31"); // 23h30 do dia 31
    expect(paraDataLocal("2026-11-01T03:00:00.000Z")).toBe("2026-11-01"); // meia-noite
  });

  it("aceita Date e outro fuso", () => {
    expect(paraDataLocal(new Date("2026-11-01T02:30:00.000Z"), "UTC")).toBe("2026-11-01");
  });
});

describe("datas.hoje", () => {
  it("usa o 'agora' recebido", () => {
    expect(hoje(new Date("2026-01-01T01:00:00.000Z"))).toBe("2025-12-31");
  });
});

describe("datas.ultimoDiaDoMes", () => {
  it.each([
    [2028, 2, 29],
    [2027, 2, 28],
    [2026, 4, 30],
    [2026, 12, 31],
  ])("%i-%i termina no dia %i", (ano, mes, dia) => {
    expect(ultimoDiaDoMes(ano, mes)).toBe(dia);
  });
});

describe("datas.adicionarMeses", () => {
  it.each([
    ["2026-01-31", 1, "2026-02-28"], // fevereiro de ano comum
    ["2028-01-31", 1, "2028-02-29"], // fevereiro de ano bissexto
    ["2026-03-31", 1, "2026-04-30"], // abril
    ["2026-12-31", 1, "2027-01-31"], // virada do ano
    ["2026-01-31", 2, "2026-03-31"], // volta ao dia 31 depois de fevereiro
    ["2026-11-15", 14, "2028-01-15"],
  ])("%s + %i mês(es) = %s", (data, meses, esperado) => {
    expect(adicionarMeses(data, meses)).toBe(esperado);
  });

  it("respeita o dia preferido informado", () => {
    expect(adicionarMeses("2026-02-28", 1, 31)).toBe("2026-03-31");
  });
});

// Sprint 4

describe("datas.adicionarDias e datas.diasEntre", () => {
  it("atravessam mês e ano", () => {
    expect(adicionarDias("2026-12-30", 3)).toBe("2027-01-02");
    expect(adicionarDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(diasEntre("2026-12-30", "2027-01-02")).toBe(3);
    expect(diasEntre("2026-11-08", "2026-11-01")).toBe(-7);
  });
});

describe("datas.ehDataValida", () => {
  it.each(["2026-02-28", "2028-02-29"])("aceita %s", (data) => {
    expect(ehDataValida(data)).toBe(true);
  });

  it.each(["2026-02-29", "2026-02-30", "2026-13-01", "20/11/2026", "", null])("recusa %p", (data) => {
    expect(ehDataValida(data)).toBe(false);
  });
});

describe("datas.inicioDoDia", () => {
  it("é a meia-noite em Brasília", () => {
    expect(inicioDoDia("2026-03-10")).toBe("2026-03-10T03:00:00.000Z");
  });
});
