const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Save your Time API',
    version: '1.0.0 (Sprint 1)',
    timestamp: new Date()
  });
});

// INTEGRANTE 1 (Vitória): Rotas do Módulo Perfil do Usuário
app.use('/api', userRoutes);

// ====================================================================
// ROTAS MOCK / PLACEHOLDERS (Aguardando implementação dos Integrantes 2 a 5)
// ====================================================================

// INTEGRANTE 2: Módulo Horas de Suor
app.post('/api/simulate', (req, res) => {
  const { precoItem } = req.body;
  const preco = Number(precoItem) || 0;
  const UserModel = require('./src/models/userModel');
  const perfil = UserModel.getProfile();
  
  const horasSuor = Number((preco / perfil.valorHora).toFixed(1));
  const diasTrabalho = Number((horasSuor / 8).toFixed(1));

  res.json({
    precoItem: preco,
    horasSuor,
    diasTrabalho,
    mensagem: `Esse item custa ${horasSuor} horas (${diasTrabalho} dias) do seu trabalho. Vale a pena?`
  });
});

// INTEGRANTE 3: Módulo Detox de Assinaturas
app.get('/api/subscriptions', (req, res) => {
  res.json([
    { id: 1, nome: 'Streaming de Vídeo', valor: 39.90, cancelado: false },
    { id: 2, nome: 'Pacote de Tarifas Banco', valor: 29.90, cancelado: true }
  ]);
});

// INTEGRANTE 4: Módulo Trava Cooldown 48h
app.get('/api/cooldown', (req, res) => {
  res.json([]);
});

// INTEGRANTE 5: Módulo Orçamento 3 Potes (50-30-20)
app.get('/api/pots', (req, res) => {
  const UserModel = require('./src/models/userModel');
  const perfil = UserModel.getProfile();
  
  res.json({
    limites: {
      sobrevivencia: perfil.salario * 0.5,
      estiloVida: perfil.salario * 0.3,
      dividas: perfil.salario * 0.2
    },
    atual: { sobrevivencia: 1100, estiloVida: 600, dividas: 400 }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Save your Time API rodando na porta ${PORT}`);
});
