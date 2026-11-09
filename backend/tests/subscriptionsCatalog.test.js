const { buscarNoCatalogo, encontrarNoCatalogo, servicoPorId } = require("../src/models/subscriptionsCatalog");

describe("subscriptionsCatalog.buscarNoCatalogo", () => {
  it("acha pelo começo do nome, sem ligar para maiúsculas, acentos e espaços", () => {
    expect(buscarNoCatalogo("NET")[0].id).toBe("netflix");
    expect(buscarNoCatalogo("globo play")[0].id).toBe("globoplay");
  });

  it("acha pelos apelidos", () => {
    expect(buscarNoCatalogo("prime").map((s) => s.id)).toEqual(["prime-video"]);
    expect(buscarNoCatalogo("office")[0].id).toBe("microsoft-365");
  });

  it("quem começa com o texto vem antes de quem só o contém", () => {
    const ids = buscarNoCatalogo("pl").map((s) => s.id);
    expect(ids.indexOf("playstation-plus")).toBeLessThan(ids.indexOf("disney-plus"));
  });

  it("devolve vazio com menos de 2 letras e o catálogo inteiro sem texto", () => {
    expect(buscarNoCatalogo("n")).toEqual([]);
    expect(buscarNoCatalogo(undefined).length).toBeGreaterThan(10);
  });

  it("traz o plano sugerido e a data e a fonte dos preços", () => {
    const [spotify] = buscarNoCatalogo("spotify");

    expect(spotify.planoSugerido).toEqual({ nome: "Individual", valor: 23.9, ciclo: "mensal", pessoas: 1, sugerido: true });
    expect(spotify.precos).toEqual({ conferidosEm: "2026-11", fonte: "site oficial" });
  });

  it("serviço sem preço conferido fica sem planos", () => {
    expect(servicoPorId("globoplay")).toMatchObject({ precos: null, planos: [], planoSugerido: null });
  });

  it("devolve cópias", () => {
    buscarNoCatalogo("netflix")[0].planos[0].valor = 0;
    expect(servicoPorId("netflix").planos[0].valor).toBe(25.9);
  });
});

describe("subscriptionsCatalog.encontrarNoCatalogo", () => {
  it.each([
    ["Netflix Padrão", "netflix"],
    ["disney+", "disney-plus"],
    ["Meu Spotify", "spotify"],
    ["Office 365 Família", "microsoft-365"],
  ])("reconhece %s", (nome, id) => {
    expect(encontrarNoCatalogo(nome).id).toBe(id);
  });

  it.each(["Streaming de Filmes", "Netflixx", "Primeira Academia"])("não confunde %s", (nome) => {
    expect(encontrarNoCatalogo(nome)).toBeNull();
  });
});
