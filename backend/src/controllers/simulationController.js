const SimulationModel = require('../models/simulationModel');

const SimulationController = {
  simular: (req, res) => {
    try {
      const { item, preco, precoItem, categoria } = req.body;
      const valorFinal = preco !== undefined ? preco : precoItem;
      const resultado = SimulationModel.simular({
        item,
        preco: valorFinal,
        categoria
      });
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao calcular simulacao de horas de suor.',
        error: error.message
      });
    }
  },

  getHistorico: (req, res) => {
    try {
      const historico = SimulationModel.getHistorico();
      return res.status(200).json({
        success: true,
        count: historico.length,
        data: historico
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao recuperar historico de simulacoes.',
        error: error.message
      });
    }
  },

  deletarHistoricoItem: (req, res) => {
    try {
      const { id } = req.params;
      const sucesso = SimulationModel.deletarItemHistorico(id);
      return res.status(200).json({
        success: sucesso,
        message: sucesso ? 'Item removido do historico.' : 'Item nao encontrado.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar item do historico.',
        error: error.message
      });
    }
  },

  atualizarStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const itemAtualizado = SimulationModel.atualizarStatusItem(id, status);
      return res.status(200).json({
        success: !!itemAtualizado,
        data: itemAtualizado
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status do item.',
        error: error.message
      });
    }
  },

  getHealthScore: (req, res) => {
    try {
      const dadosHealthScore = SimulationModel.getHealthScore();
      return res.status(200).json({
        success: true,
        data: dadosHealthScore
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao calcular Financial Health Score.',
        error: error.message
      });
    }
  }
};

module.exports = SimulationController;
