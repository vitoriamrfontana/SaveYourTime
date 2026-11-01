const { arredondar, somar, multiplicar } = require("../src/utils/dinheiro");

describe("dinheiro.somar", () => {
  it("soma em centavos, sem erro de ponto flutuante", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(somar([0.1, 0.2])).toBe(0.3);
    expect(somar([39.9, 21.9, 19.9, 24.9, 34.9])).toBe(141.5);
  });

  it("lista vazia soma zero", () => {
    expect(somar([])).toBe(0);
  });
});

describe("dinheiro.multiplicar", () => {
  it("multiplica sem resíduo", () => {
    expect(74.8 * 12).not.toBe(897.6);
    expect(multiplicar(74.8, 12)).toBe(897.6);
    expect(multiplicar(39.9, 60)).toBe(2394);
  });
});

describe("dinheiro.arredondar", () => {
  it("arredonda para centavos", () => {
    expect(arredondar(39.9 / 3)).toBe(13.3);
    expect(arredondar(1.8235)).toBe(1.82);
  });
});
