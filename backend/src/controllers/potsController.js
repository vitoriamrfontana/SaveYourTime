const PotsModel = require('../models/potsModel');
const apiResponse = require('../utils/apiResponse');

function enviarErro(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

const PotsController = {
  getResumo: (req, res) => {
    try {
      const mes = req.query.mes || undefined;
      const resumo = PotsModel.getResumo(mes);
      return apiResponse(res, 200, resumo);
    } catch (error) {
      return enviarErro(res, 400, error.message);
    }
  },

  listarLancamentos: (req, res) => {
    try {
      const mes = req.query.mes || undefined;
      const categoria = req.query.categoria || undefined;

      if (categoria && !PotsModel.CATEGORIAS[categoria]) {
        return enviarErro(res, 400, 'Categoria inválida.');
      }

      const lancamentos = PotsModel.listarLancamentos(mes || PotsModel.getResumo().mes, categoria);
      return apiResponse(res, 200, lancamentos);
    } catch (error) {
      return enviarErro(res, 400, error.message);
    }
  },

  criarLancamento: (req, res) => {
    try {
      const { categoria, valor, descricao, data } = req.body;
      const lancamento = PotsModel.adicionarLancamento({ categoria, valor, descricao, data });
      const resumo = PotsModel.getResumo(lancamento.data.slice(0, 7));

      return res.status(201).json({
        success: true,
        message: 'Lançamento adicionado com sucesso.',
        data: {
          lancamento,
          resumo,
        },
      });
    } catch (error) {
      return enviarErro(res, 400, error.message);
    }
  },

  removerLancamento: (req, res) => {
    try {
      const removido = PotsModel.removerLancamento(req.params.id);

      if (!removido) {
        return enviarErro(res, 404, 'Lançamento não encontrado.');
      }

      const resumo = PotsModel.getResumo(removido.data.slice(0, 7));
      return apiResponse(res, 200, {
        lancamento: removido,
        resumo,
      });
    } catch (error) {
      return enviarErro(res, 400, error.message);
    }
  },
};

module.exports = PotsController;
