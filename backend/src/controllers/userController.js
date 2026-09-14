const UserModel = require('../models/userModel');

const UserController = {
  getProfile: (req, res) => {
    try {
      const profile = UserModel.getProfile();
      return res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar perfil do usuário.',
        error: error.message
      });
    }
  },

  updateProfile: (req, res) => {
    try {
      const { nome, salario, horasMensais, metaEconomia } = req.body;

      if (salario !== undefined && Number(salario) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'O salário deve ser um valor maior que zero.'
        });
      }

      if (horasMensais !== undefined && Number(horasMensais) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'A carga horária mensal deve ser maior que zero.'
        });
      }

      const updatedProfile = UserModel.updateProfile({
        nome,
        salario,
        horasMensais,
        metaEconomia
      });

      return res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso!',
        data: updatedProfile
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar perfil do usuário.',
        error: error.message
      });
    }
  }
};

module.exports = UserController;
