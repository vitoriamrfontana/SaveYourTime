/**
 * criarAppDetox - app Express só com as rotas do Detox, montado como no
 * server.js, para testar as rotas via HTTP (supertest) sem subir o servidor:
 * o server.js chama app.listen e não exporta o app.
 */

const express = require("express");
const subscriptionsRoutes = require("../../src/routes/subscriptionsRoutes");
const { errorHandler, notFoundHandler } = require("../../src/middlewares/errorHandler");

function criarAppDetox() {
  const app = express();
  app.use(express.json());
  app.use("/api/subscriptions", subscriptionsRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = criarAppDetox;
