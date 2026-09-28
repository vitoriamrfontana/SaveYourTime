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
  }
};

module.exports = DealsController;