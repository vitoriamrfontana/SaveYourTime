const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');
const subscriptionsRoutes = require('./src/routes/subscriptionsRoutes');
const dealsRoutes = require('./src/routes/dealsRoutes');
const { errorHandler, notFoundHandler } = require('./src/middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Save your Time API',
    version: '2.0.0 (Sprint 2)',
    timestamp: new Date()
  });
});

app.use('/api', userRoutes);

app.post('/api/simulate', (req, res) => {
  const item = req.body.item || 'Item';
  const preco = Number(req.body.preco ?? req.body.precoItem) || 0;
  const UserModel = require('./src/models/userModel');
  const perfil = UserModel.getProfile();
  const vHora = perfil.valorHora || 21.88;
  const salario = perfil.salario || 3500;
  
  const horasSuor = Number((preco / vHora).toFixed(1));
  const diasTrabalho = Number((horasSuor / 8).toFixed(1));
  const percentualSalario = Number(((preco / salario) * 100).toFixed(1));

  const simulacao = {
    item,
    preco,
    horasSuor,
    diasTrabalho,
    percentualSalario
  };

  res.json({
    simulacao,
    precoItem: preco,
    horasSuor,
    diasTrabalho,
    percentualSalario,
    mensagem: `O item "${item}" (R$ ${preco.toFixed(2)}) custará ${horasSuor} horas (${diasTrabalho} dias úteis) do seu trabalho.`
  });
});

app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/deals', dealsRoutes);

app.get('/api/cooldown', (req, res) => {
  res.json([]);
});

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

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Servidor Save your Time API rodando na porta ${PORT}`);
});