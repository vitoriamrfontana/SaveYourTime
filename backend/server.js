const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dados em memória para protótipo / MVP
let perfilUsuario = {
  nome: 'Usuário Exemplo',
  salario: 3000.0,
  horasMensais: 160,
  valorHora: 18.75
};

let assinaturas = [
  { id: 1, nome: 'Streaming de Vídeo', valor: 39.90, cancelado: false },
  { id: 2, nome: 'Pacote de Tarifas Banco', valor: 29.90, cancelado: true }
];

let desejos = [];
let lancamentosPotes = { sobrevivencia: 1100, estiloVida: 600, dividas: 400 };

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Save your Time API', timestamp: new Date() });
});

// INTEGRANTE 1: Perfil do Usuário (Salário e Carga Horária)
app.get('/api/user', (req, res) => res.json(perfilUsuario));
app.put('/api/user', (req, res) => {
  const { salario, horasMensais } = req.body;
  if (salario && horasMensais) {
    perfilUsuario.salario = Number(salario);
    perfilUsuario.horasMensais = Number(horasMensais);
    perfilUsuario.valorHora = Number((salario / horasMensais).toFixed(2));
  }
  res.json(perfilUsuario);
});

// INTEGRANTE 2: Módulo Horas de Suor
app.post('/api/simulate', (req, res) => {
  const { precoItem } = req.body;
  const preco = Number(precoItem) || 0;
  const horasSuor = Number((preco / perfilUsuario.valorHora).toFixed(1));
  const diasTrabalho = Number((horasSuor / 8).toFixed(1));

  res.json({
    precoItem: preco,
    horasSuor,
    diasTrabalho,
    mensagem: `Esse item custa ${horasSuor} horas (${diasTrabalho} dias) do seu trabalho. Vale a pena?`
  });
});

// INTEGRANTE 3: Módulo Detox de Assinaturas
app.get('/api/subscriptions', (req, res) => res.json(assinaturas));

// INTEGRANTE 4: Módulo Trava Cooldown 48h
app.get('/api/cooldown', (req, res) => res.json(desejos));

// INTEGRANTE 5: Módulo Orçamento 3 Potes (50-30-20)
app.get('/api/pots', (req, res) => {
  const limiteSobrevivencia = perfilUsuario.salario * 0.5;
  const limiteEstiloVida = perfilUsuario.salario * 0.3;
  const limiteDividas = perfilUsuario.salario * 0.2;

  res.json({
    limites: { sobrevivencia: limiteSobrevivencia, estiloVida: limiteEstiloVida, dividas: limiteDividas },
    atual: lancamentosPotes
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Save your Time API rodando na porta ${PORT}`);
});
