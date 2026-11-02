const taxasService = require("../src/services/taxasService");

const AGORA = new Date("2026-11-01T15:00:00.000Z");
const HORA = 60 * 60 * 1000;

// Nenhum teste chama a internet: o fetch é sempre falso, no formato da API SGS
function respostaSgs(valor, data = "29/10/2026") {
  return { ok: true, status: 200, json: async () => [{ data, valor }] };
}

// 4389 = CDI anualizado; 13522 = IPCA em 12 meses
function fetchCom({ cdi = "13.65", ipca = "4.58" } = {}) {
  return jest.fn(async (url) => respostaSgs(url.includes("sgs.4389") ? cdi : ipca));
}

beforeEach(() => {
  taxasService._limparCache();
});

describe("taxasService.obterTaxas", () => {
  it("busca o CDI e o IPCA no Banco Central", async () => {
    const fetchImpl = fetchCom({ cdi: "13.65", ipca: "4.58" });
    const taxas = await taxasService.obterTaxas({ agora: AGORA, fetchImpl });

    expect(taxas).toMatchObject({ fonte: "bcb", atualizadoEm: "2026-10-29" });
    expect(taxas.cdiAnual).toBeCloseTo(0.1365, 6);
    expect(taxas.ipca12m).toBeCloseTo(0.0458, 6);
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json",
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json",
    ]);
  });

  it("guarda o resultado por 24 horas", async () => {
    const fetchImpl = fetchCom();

    await taxasService.obterTaxas({ agora: AGORA, fetchImpl });
    await taxasService.obterTaxas({ agora: new Date(AGORA.getTime() + 23 * HORA), fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2); // só a primeira busca (duas séries)

    await taxasService.obterTaxas({ agora: new Date(AGORA.getTime() + 25 * HORA), fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["fora do ar", () => jest.fn().mockRejectedValue(new Error("ECONNREFUSED"))],
    ["respondendo erro HTTP", () => jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })],
    ["com JSON inesperado", () => jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ erro: "x" }) })],
    ["mandando valor que não é número", () => fetchCom({ cdi: "abc" })],
    ["mandando valor absurdo", () => fetchCom({ cdi: "900" })],
  ])("usa as taxas de reserva com o Banco Central %s", async (_, criarFetch) => {
    expect(await taxasService.obterTaxas({ agora: AGORA, fetchImpl: criarFetch() })).toEqual(taxasService.RESERVA);
  });

  it("desiste depois do tempo limite e usa a reserva", async () => {
    // Nunca responde: só termina quando o AbortController cancela
    const fetchImpl = jest.fn(
      (url, { signal }) => new Promise((_, rejeitar) => signal.addEventListener("abort", () => rejeitar(new Error("abortado"))))
    );

    expect(await taxasService.obterTaxas({ agora: AGORA, fetchImpl, tempoLimiteMs: 20 })).toEqual(taxasService.RESERVA);
  });

  it("com o Banco Central fora, tenta de novo depois de 10 minutos", async () => {
    await taxasService.obterTaxas({ agora: AGORA, fetchImpl: jest.fn().mockRejectedValue(new Error("fora")) });
    const voltou = fetchCom();

    const cincoMinutosDepois = await taxasService.obterTaxas({ agora: new Date(AGORA.getTime() + 5 * 60000), fetchImpl: voltou });
    const onzeMinutosDepois = await taxasService.obterTaxas({ agora: new Date(AGORA.getTime() + 11 * 60000), fetchImpl: voltou });

    expect(cincoMinutosDepois.fonte).toBe("fallback");
    expect(onzeMinutosDepois.fonte).toBe("bcb");
  });

  it("a reserva é a mesma taxa que o model usa", () => {
    expect(taxasService.RESERVA).toEqual({ cdiAnual: 0.1365, ipca12m: 0.0458, fonte: "fallback", atualizadoEm: "2026-10-29" });
  });
});
