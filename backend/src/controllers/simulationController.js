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
  },

  getEvolucaoHealthScore: (req, res) => {
    try {
      const timelineData = SimulationModel.getHealthScoreTimeline();
      return res.status(200).json({
        success: true,
        data: timelineData
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar evolucao temporal do Financial Health Score.',
        error: error.message
      });
    }
  },

  getConquistas: (req, res) => {
    try {
      const conquistasData = SimulationModel.getConquistas();
      return res.status(200).json({
        success: true,
        data: conquistasData
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar conquistas e badges do usuario.',
        error: error.message
      });
    }
  },

  criarMetaLiberdade: (req, res) => {
    try {
      const { titulo, categoria, valorAlvo, valorAtual } = req.body;
      const novaMeta = SimulationModel.criarMetaLiberdade({
        titulo,
        categoria,
        valorAlvo,
        valorAtual
      });
      return res.status(201).json({
        success: true,
        data: novaMeta
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar meta de liberdade financeira.'
      });
    }
  },

  getMetasProgresso: (req, res) => {
    try {
      const { valorHora } = req.query;
      const dados = SimulationModel.getMetasProgresso(valorHora);
      return res.status(200).json({
        success: true,
        data: dados
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao calcular progresso das metas de liberdade.',
        error: error.message
      });
    }
  },

  aportarMeta: (req, res) => {
    try {
      const { id } = req.params;
      const { valor } = req.body;
      const metaAtualizada = SimulationModel.aportarNaMeta(id, valor);
      return res.status(200).json({
        success: true,
        data: metaAtualizada
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao realizar aporte na meta.'
      });
    }
  },

  simularImpactoMeta: (req, res) => {
    try {
      const { valorPoupado } = req.body;
      const { valorHora } = req.query;
      const resultado = SimulationModel.simularImpactoPoupanca(valorPoupado, valorHora);
      return res.status(200).json({
        success: true,
        data: resultado
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao simular impacto nas metas de liberdade.',
        error: error.message
      });
    }
  }
};

module.exports = SimulationController;
