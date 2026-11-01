/**
 * TAXONOMIA - Detox de Assinaturas
 *
 * Sprint 4: categorias, tipos, ciclos de cobrança, status e os rótulos de cada um
 * num lugar só. O app recebe tudo por GET /api/subscriptions/meta e para de
 * repetir os rótulos nos componentes.
 */

const CATEGORIAS = ["streaming", "saude", "financeiro", "software", "outros"];
const CATEGORIA_PADRAO = "outros";

// Tipo = a função do serviço. Duas assinaturas ativas do MESMO tipo (e, portanto,
// da mesma categoria) são concorrentes. Comparar só a categoria daria falso alarme:
// "Tarifa da conta" e "Seguro celular" são ambas "financeiro", mas não competem.
const TIPOS_POR_CATEGORIA = {
  streaming: ["video", "musica"],
  saude: ["academia", "plano_saude"],
  financeiro: ["conta_bancaria", "seguro", "cartao"],
  software: ["nuvem", "produtividade", "jogos"],
  outros: [],
};

const ROTULOS_CATEGORIA = {
  streaming: "Streaming",
  saude: "Saúde",
  financeiro: "Financeiro",
  software: "Software",
  outros: "Outros",
};

// rotulo: nos chips do formulário. descricao: no meio de uma frase
// ("2 serviços de streaming de vídeo ativos").
const ROTULOS_TIPO = {
  video: { rotulo: "Vídeo", descricao: "streaming de vídeo" },
  musica: { rotulo: "Música", descricao: "streaming de música" },
  academia: { rotulo: "Academia", descricao: "academia" },
  plano_saude: { rotulo: "Plano de saúde", descricao: "plano de saúde" },
  conta_bancaria: { rotulo: "Conta bancária", descricao: "conta bancária" },
  seguro: { rotulo: "Seguro", descricao: "seguro" },
  cartao: { rotulo: "Cartão", descricao: "cartão" },
  nuvem: { rotulo: "Nuvem", descricao: "armazenamento em nuvem" },
  produtividade: { rotulo: "Produtividade", descricao: "produtividade" },
  jogos: { rotulo: "Jogos", descricao: "jogos" },
};

const CICLOS = ["semanal", "mensal", "trimestral", "semestral", "anual"];
const CICLO_PADRAO = "mensal";

// Quantos meses cabem em cada ciclo. O semanal anda de 7 em 7 dias e fica de fora.
const MESES_POR_CICLO = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };

// frase: depois de um valor ("R$ 119,90 por ano")
const ROTULOS_CICLO = {
  semanal: { rotulo: "Semanal", frase: "por semana" },
  mensal: { rotulo: "Mensal", frase: "por mês" },
  trimestral: { rotulo: "Trimestral", frase: "por trimestre" },
  semestral: { rotulo: "Semestral", frase: "por semestre" },
  anual: { rotulo: "Anual", frase: "por ano" },
};

const STATUS = ["ativa", "teste", "pausada", "cancelada"];

const ROTULOS_STATUS = {
  ativa: "Ativa",
  teste: "Teste grátis",
  pausada: "Pausada",
  cancelada: "Cancelada",
};

// Estado vazio do app: cobranças que costumam passar despercebidas.
// Marcar um item abre o formulário com nome, categoria e tipo preenchidos.
const CHECKLIST = [
  {
    id: "tarifa-conta",
    nome: "Tarifa ou pacote de serviços da conta",
    categoria: "financeiro",
    tipo: "conta_bancaria",
    dica: "Aparece no extrato como tarifa, cesta ou pacote de serviços.",
  },
  {
    id: "anuidade-cartao",
    nome: "Anuidade do cartão de crédito",
    categoria: "financeiro",
    tipo: "cartao",
    dica: "Costuma vir na fatura, às vezes dividida em 12 vezes.",
  },
  {
    id: "seguro-cartao",
    nome: "Seguro do cartão ou proteção de compras",
    categoria: "financeiro",
    tipo: "seguro",
    dica: "Pode vir embutido na fatura: confira se foi você que contratou.",
  },
  {
    id: "seguro-celular",
    nome: "Seguro do celular",
    categoria: "financeiro",
    tipo: "seguro",
    dica: "Muitas vezes é contratado junto com o aparelho e cobrado todo mês.",
  },
  {
    id: "extras-celular",
    nome: "Serviços extras na conta do celular",
    categoria: "outros",
    tipo: null,
    dica: "Jogos, notícias ou horóscopo por SMS: confira a conta da operadora.",
  },
  {
    id: "streaming-video",
    nome: "Streaming de filmes e séries",
    categoria: "streaming",
    tipo: "video",
    dica: "Vale conferir se mais de um está ativo ao mesmo tempo.",
  },
  {
    id: "streaming-musica",
    nome: "Streaming de música",
    categoria: "streaming",
    tipo: "musica",
    dica: "Planos família costumam sair mais baratos por pessoa.",
  },
  {
    id: "nuvem",
    nome: "Armazenamento em nuvem",
    categoria: "software",
    tipo: "nuvem",
    dica: "O backup de fotos do celular costuma ser cobrado à parte.",
  },
  {
    id: "apps-jogos",
    nome: "Apps e jogos com assinatura",
    categoria: "software",
    tipo: "jogos",
    dica: "Confira as assinaturas na loja de aplicativos do celular.",
  },
  {
    id: "academia",
    nome: "Academia ou app de treino",
    categoria: "saude",
    tipo: "academia",
    dica: "Planos com fidelidade continuam cobrando mesmo sem uso.",
  },
  {
    id: "clube-assinatura",
    nome: "Clube de assinatura (vinho, livros, café)",
    categoria: "outros",
    tipo: null,
    dica: "A renovação automática é comum depois do primeiro mês com desconto.",
  },
];

module.exports = {
  CATEGORIAS,
  CATEGORIA_PADRAO,
  TIPOS_POR_CATEGORIA,
  ROTULOS_CATEGORIA,
  ROTULOS_TIPO,
  CICLOS,
  CICLO_PADRAO,
  MESES_POR_CICLO,
  ROTULOS_CICLO,
  STATUS,
  ROTULOS_STATUS,
  CHECKLIST,
};
