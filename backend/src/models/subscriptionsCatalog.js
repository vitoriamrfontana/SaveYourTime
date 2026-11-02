/**
 * CATÁLOGO - Detox de Assinaturas
 *
 * Sprint 4: serviços conhecidos. O autocomplete do cadastro sugere categoria,
 * tipo e valor; o guia de cancelamento mostra o link oficial; e os planos são a
 * base do otimizador de planos.
 *
 * Os preços são só REFERÊNCIA: cada serviço diz em que mês foram conferidos e
 * onde (site oficial ou imprensa). Serviços mudam de preço sem aviso, então o app
 * deixa a pessoa editar o valor e nunca o mostra como preço atual. Sem uma fonte
 * confiável, a lista de planos fica vazia. Preços e links conferidos em 01/11/2026.
 */

const DO_SITE = "site oficial";
const DA_IMPRENSA = "imprensa";

const LINK_GOOGLE_PLAY = "https://play.google.com/store/account/subscriptions";
const LINK_APPLE = "https://apps.apple.com/account/subscriptions";
const LINK_MICROSOFT = "https://account.microsoft.com/services";

// pessoas: quantas contas o plano permite (Duo e Família); 1 nos individuais
const CATALOGO = [
  {
    id: "netflix",
    nome: "Netflix",
    apelidos: [],
    categoria: "streaming",
    tipo: "video",
    precos: { conferidosEm: "2026-11", fonte: DO_SITE },
    planos: [
      { nome: "Padrão com anúncios", valor: 25.9, ciclo: "mensal", pessoas: 1 },
      { nome: "Padrão", valor: 51.9, ciclo: "mensal", pessoas: 1, sugerido: true },
      { nome: "Premium", valor: 71.9, ciclo: "mensal", pessoas: 1 },
    ],
    linkCancelamento: "https://help.netflix.com/pt/node/407",
  },
  {
    id: "prime-video",
    nome: "Amazon Prime",
    apelidos: ["Prime Video", "Amazon Prime Video"],
    categoria: "streaming",
    tipo: "video",
    precos: { conferidosEm: "2026-11", fonte: DA_IMPRENSA },
    planos: [
      { nome: "Mensal", valor: 19.9, ciclo: "mensal", pessoas: 1, sugerido: true },
      { nome: "Anual", valor: 166.8, ciclo: "anual", pessoas: 1 },
    ],
    linkCancelamento: "https://www.amazon.com.br/gp/primecentral",
  },
  {
    id: "disney-plus",
    nome: "Disney+",
    apelidos: ["Disney Plus"],
    categoria: "streaming",
    tipo: "video",
    precos: { conferidosEm: "2026-11", fonte: DA_IMPRENSA },
    planos: [
      { nome: "Padrão com anúncios", valor: 29.9, ciclo: "mensal", pessoas: 1 },
      { nome: "Padrão", valor: 49.9, ciclo: "mensal", pessoas: 1, sugerido: true },
      { nome: "Premium", valor: 69.9, ciclo: "mensal", pessoas: 1 },
    ],
    linkCancelamento: "https://www.disneyplus.com/pt-br/account/subscription",
  },
  {
    id: "hbo-max",
    nome: "HBO Max",
    apelidos: ["HBO"],
    categoria: "streaming",
    tipo: "video",
    precos: { conferidosEm: "2026-11", fonte: DA_IMPRENSA },
    planos: [
      { nome: "Básico com anúncios", valor: 29.9, ciclo: "mensal", pessoas: 1 },
      { nome: "Standard", valor: 44.9, ciclo: "mensal", pessoas: 1, sugerido: true },
      { nome: "Platinum", valor: 55.9, ciclo: "mensal", pessoas: 1 },
    ],
    linkCancelamento: "https://help.hbomax.com/br-pt/answer/detail/000002526",
  },
  {
    id: "globoplay",
    nome: "Globoplay",
    apelidos: ["Globo Play"],
    categoria: "streaming",
    tipo: "video",
    precos: null,
    planos: [],
    linkCancelamento: "https://minhaconta.globo.com/",
  },
  {
    id: "youtube-premium",
    nome: "YouTube Premium",
    apelidos: ["YouTube", "YouTube Music"],
    categoria: "streaming",
    tipo: "video",
    precos: { conferidosEm: "2026-11", fonte: DA_IMPRENSA },
    planos: [
      { nome: "Individual", valor: 26.9, ciclo: "mensal", pessoas: 1, sugerido: true },
      { nome: "Individual anual", valor: 269, ciclo: "anual", pessoas: 1 },
      { nome: "Estudante", valor: 16.9, ciclo: "mensal", pessoas: 1 },
    ],
    linkCancelamento: "https://www.youtube.com/paid_memberships",
  },
  {
    id: "spotify",
    nome: "Spotify",
    apelidos: ["Spotify Premium"],
    categoria: "streaming",
    tipo: "musica",
    precos: { conferidosEm: "2026-11", fonte: DO_SITE },
    planos: [
      { nome: "Individual", valor: 23.9, ciclo: "mensal", pessoas: 1, sugerido: true },
      { nome: "Duo", valor: 31.9, ciclo: "mensal", pessoas: 2 },
      { nome: "Família", valor: 40.9, ciclo: "mensal", pessoas: 6 },
      { nome: "Universitário", valor: 12.9, ciclo: "mensal", pessoas: 1 },
    ],
    linkCancelamento: "https://support.spotify.com/br-pt/article/cancel-premium/",
  },
  {
    id: "deezer",
    nome: "Deezer",
    apelidos: ["Deezer Premium"],
    categoria: "streaming",
    tipo: "musica",
    precos: null,
    planos: [],
    linkCancelamento: "https://www.deezer.com/account/subscription",
  },
  {
    id: "apple-music",
    nome: "Apple Music",
    apelidos: [],
    categoria: "streaming",
    tipo: "musica",
    precos: null,
    planos: [],
    linkCancelamento: LINK_APPLE,
  },
  {
    id: "icloud",
    nome: "iCloud+",
    apelidos: ["iCloud"],
    categoria: "software",
    tipo: "nuvem",
    precos: null,
    planos: [],
    linkCancelamento: LINK_APPLE,
  },
  {
    id: "google-one",
    nome: "Google One",
    apelidos: ["Google Drive"],
    categoria: "software",
    tipo: "nuvem",
    precos: null,
    planos: [],
    linkCancelamento: LINK_GOOGLE_PLAY,
  },
  {
    id: "xbox-game-pass",
    nome: "Xbox Game Pass",
    apelidos: ["Game Pass", "Xbox"],
    categoria: "software",
    tipo: "jogos",
    precos: null,
    planos: [],
    linkCancelamento: LINK_MICROSOFT,
  },
  {
    id: "playstation-plus",
    nome: "PlayStation Plus",
    apelidos: ["PS Plus", "PlayStation"],
    categoria: "software",
    tipo: "jogos",
    precos: null,
    planos: [],
    linkCancelamento: "https://www.playstation.com/pt-br/support/subscriptions/cancel-playstation-plus/",
  },
  {
    id: "microsoft-365",
    nome: "Microsoft 365",
    apelidos: ["Office 365", "Office"],
    categoria: "software",
    tipo: "produtividade",
    precos: null,
    planos: [],
    linkCancelamento: LINK_MICROSOFT,
  },
  {
    id: "canva",
    nome: "Canva",
    apelidos: ["Canva Pro"],
    categoria: "software",
    tipo: "produtividade",
    precos: null,
    planos: [],
    linkCancelamento: "https://www.canva.com/settings/billing-and-teams",
  },
];

// Guia de cancelamento: vale para qualquer serviço (o link específico vem do catálogo)
const PASSOS_PARA_CANCELAR = [
  "Entre na sua conta pelo site ou pelo app do serviço e procure Conta, Assinatura ou Plano.",
  "Escolha cancelar e confirme. Guarde o e-mail ou um print da confirmação.",
  "Se você assinou pela loja de aplicativos do celular, o cancelamento é feito lá, e não no serviço.",
  "Depois de cancelar, o acesso costuma continuar até o fim do período que já foi pago.",
];

const LOJAS_DE_APLICATIVOS = [
  { nome: "Google Play", link: LINK_GOOGLE_PLAY },
  { nome: "App Store", link: LINK_APPLE },
];

// Conteúdo informativo, com a base legal conferida em 01/11/2026 no planalto.gov.br.
// "regulados": só vale para serviços regulados pelo governo federal (Decreto 11.034, art. 1º).
const DIREITOS_DO_CONSUMIDOR = [
  {
    id: "arrependimento",
    titulo: "Arrependimento em 7 dias",
    texto:
      "Se você contratou fora de uma loja física (pela internet, por telefone ou pelo app), pode desistir em até 7 dias da contratação e receber de volta, corrigido, o que pagou.",
    baseLegal: "Código de Defesa do Consumidor (Lei 8.078/1990), art. 49",
    regulados: false,
  },
  {
    id: "cancelamento-imediato",
    titulo: "Cancelamento pelo mesmo canal, com efeito imediato",
    texto:
      "Em bancos, cartões, seguros, planos de saúde, operadoras de telefone e outros serviços regulados pelo governo federal, o cancelamento pode ser pedido pelo mesmo canal usado para contratar, vale na hora e dá direito a comprovante.",
    baseLegal: "Decreto 11.034/2022, art. 14",
    regulados: true,
  },
];

const AVISO_JURIDICO =
  "Conteúdo informativo, não é aconselhamento jurídico. Se tiver problema, procure o Procon da sua cidade ou o consumidor.gov.br.";

// Minúsculas, sem acento e sem pontuação: "Disney+" -> "disney", "iCloud+" -> "icloud"
function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nomesDe(servico) {
  return [servico.nome, ...servico.apelidos].map(normalizarTexto);
}

function planoSugerido(servico) {
  return servico.planos.find((p) => p.sugerido) ?? servico.planos[0] ?? null;
}

function copiarServico(servico) {
  const sugerido = planoSugerido(servico);
  return {
    ...servico,
    apelidos: [...servico.apelidos],
    precos: servico.precos ? { ...servico.precos } : null,
    planos: servico.planos.map((p) => ({ ...p })),
    planoSugerido: sugerido ? { ...sugerido } : null,
  };
}

function servicoPorId(id) {
  const servico = CATALOGO.find((s) => s.id === id);
  return servico ? copiarServico(servico) : null;
}

// O serviço cujo nome (ou apelido) aparece como palavra inteira no nome da assinatura:
// "Netflix Padrão" -> Netflix; "Streaming de Filmes" não casa com nada
function encontrarNoCatalogo(nome) {
  const texto = ` ${normalizarTexto(nome)} `;
  const servico = CATALOGO.find((s) => nomesDe(s).some((n) => texto.includes(` ${n} `)));
  return servico ? copiarServico(servico) : null;
}

// Autocomplete: sem texto, devolve tudo; com texto, quem começa com ele vem antes de
// quem só o contém
function buscarNoCatalogo(busca, limite = 8) {
  if (busca == null) return CATALOGO.map(copiarServico);

  const termo = normalizarTexto(busca);
  if (termo.length < 2) return [];

  const relevancia = (servico) => {
    const nomes = nomesDe(servico);
    if (nomes.some((n) => n.startsWith(termo))) return 0;
    if (nomes.some((n) => n.includes(termo))) return 1;
    return null;
  };

  return CATALOGO.map((servico) => ({ servico, ordem: relevancia(servico) }))
    .filter(({ ordem }) => ordem !== null)
    .sort((a, b) => a.ordem - b.ordem || a.servico.nome.localeCompare(b.servico.nome))
    .slice(0, limite)
    .map(({ servico }) => copiarServico(servico));
}

module.exports = {
  PASSOS_PARA_CANCELAR,
  LOJAS_DE_APLICATIVOS,
  DIREITOS_DO_CONSUMIDOR,
  AVISO_JURIDICO,
  servicoPorId,
  encontrarNoCatalogo,
  buscarNoCatalogo,
};
