const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');
const subscriptionsRoutes = require('./src/routes/subscriptionsRoutes');
const simulationRoutes = require('./src/routes/simulationRoutes');
const dealsRoutes = require('./src/routes/dealsRoutes');
const potsRoutes = require('./src/routes/potsRoutes');
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

app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/simulate', simulationRoutes);

app.get('/api/cooldown', (req, res) => {
  res.json([]);
});

app.use('/api/pots', potsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Servidor Save your Time API rodando na porta ${PORT}`);
});