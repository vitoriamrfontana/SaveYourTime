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
  // Sprint 4: antes "outros" não tinha tipos e nunca gerava alerta de concorrentes
  outros: ["educacao", "noticias", "delivery"],
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
  educacao: { rotulo: "Educação", descricao: "cursos e idiomas" },
  noticias: { rotulo: "Notícias", descricao: "jornais e revistas" },
  delivery: { rotulo: "Delivery", descricao: "clubes de entrega" },
};

// Sprint 4: custo por uso justo. Nos tipos que têm "uso", a comparação é com quanto
// custaria usar uma vez sem assinar (referência aproximada, só para comparar): até
// metade da referência é excelente, até a referência é neutro e acima é prejuízo.
const USO_POR_TIPO = {
  video: { referencia: 15, explicacao: "Alugar um filme custa cerca de R$ 15." },
  musica: {
    referencia: 5,
    explicacao: "Acima de R$ 5 por dia de uso, o plano grátis com anúncios provavelmente atende.",
  },
  academia: { referencia: 30, explicacao: "Uma diária avulsa de academia custa cerca de R$ 30." },
  jogos: {
    referencia: 10,
    explicacao: "Acima de R$ 10 por sessão, comprar jogos avulsos em promoção pode sair mais barato.",
  },
  produtividade: {
    referencia: 10,
    explicacao: "Acima de R$ 10 por dia de uso, vale ver se o plano gratuito resolve.",
  },
  educacao: { referencia: 40, explicacao: "Uma aula avulsa custa cerca de R$ 40." },
  noticias: { referencia: 5, explicacao: "Uma edição avulsa custa cerca de R$ 5." },
  delivery: {
    referencia: 8,
    explicacao: "Acima de R$ 8 por pedido, o clube custa mais do que pagar a taxa de entrega.",
  },
};

// Sprint 4: onde não existe "uso" para contar, a pergunta certa. "Sim" quer dizer
// que vale manter. Plano de saúde fica de fora: é proteção, não se mede por uso.
const PERGUNTA_POR_TIPO = {
  seguro: "Você acionou este seguro nos últimos 12 meses?",
  conta_bancaria: "Você usa serviços que um pacote mais barato da conta não cobre?",
  cartao: "Os benefícios do cartão (pontos, cashback, descontos) valem mais do que a anuidade?",
  nuvem: "Você usa mais espaço do que o plano gratuito oferece?",
};

// Sem tipo, continuam valendo os limites gerais da Sprint 3 (R$ 5 e R$ 15 por uso)
const EXPLICACAO_SEM_TIPO =
  "Sem tipo, a comparação usa limites gerais: até R$ 5 por uso é excelente e acima de R$ 15 é prejuízo.";

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
  {
    id: "clube-delivery",
    nome: "Clube de delivery (frete grátis)",
    categoria: "outros",
    tipo: "delivery",
    dica: "Só compensa se a soma das taxas de entrega que você pagaria passa da mensalidade.",
  },
  {
    id: "curso-idiomas",
    nome: "Curso ou aplicativo de idiomas",
    categoria: "outros",
    tipo: "educacao",
    dica: "Planos anuais renovam sozinhos, muitas vezes sem aviso.",
  },
];

module.exports = {
  CATEGORIAS,
  CATEGORIA_PADRAO,
  TIPOS_POR_CATEGORIA,
  ROTULOS_CATEGORIA,
  ROTULOS_TIPO,
  USO_POR_TIPO,
  PERGUNTA_POR_TIPO,
  EXPLICACAO_SEM_TIPO,
  CICLOS,
  CICLO_PADRAO,
  MESES_POR_CICLO,
  ROTULOS_CICLO,
  STATUS,
  ROTULOS_STATUS,
  CHECKLIST,
};
