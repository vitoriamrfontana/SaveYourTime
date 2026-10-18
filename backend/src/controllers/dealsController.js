const DealsModel = require('../models/dealsModel');

const DealsController = {
  searchDeals: (req, res) => {
    try {
      const { q, valorHora } = req.query;
      const results = DealsModel.buscarOfertas(q, valorHora);
      return res.status(200).json({
        success: true,
        count: results.length,
        query: q || '',
        data: results
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar comparativo de ofertas.',
        error: error.message
      });
    }
  },

  getFeaturedDeals: (req, res) => {
    try {
      const { valorHora } = req.query;
      const results = DealsModel.getDestaques(valorHora);
      return res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter ofertas em destaque.',
        error: error.message
      });
    }
  },

  getPriceHistory: (req, res) => {
    try {
      const { id } = req.params;
      const { periodo, valorHora } = req.query;
      const historico = DealsModel.getHistoricoPrecos(id, periodo, valorHora);
      return res.status(200).json({
        success: true,
        data: historico
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao consultar historico de precos do produto.',
        error: error.message
      });
    }
  },

  createPriceAlert: (req, res) => {
    try {
      const { produtoId, precoAlvo, valorHora } = req.body;
      const alerta = DealsModel.criarAlertaPreco({ produtoId, precoAlvo, valorHoraInformado: valorHora });
      return res.status(201).json({
        success: true,
        message: 'Alerta de preco criado com sucesso.',
        data: alerta
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar alerta de preco.',
        error: error.message
      });
    }
  },

  getPriceAlerts: (req, res) => {
    try {
      const alertas = DealsModel.getAlertas();
      return res.status(200).json({
        success: true,
        count: alertas.length,
        data: alertas
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar alertas de preco.',
        error: error.message
      });
    }
  },

  deletePriceAlert: (req, res) => {
    try {
      const { id } = req.params;
      const sucesso = DealsModel.deletarAlerta(id);
      return res.status(200).json({
        success: sucesso,
        message: sucesso ? 'Alerta removido com sucesso.' : 'Alerta nao encontrado.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao remover alerta de preco.',
        error: error.message
      });
    }
  }
};

module.exports = DealsController;
