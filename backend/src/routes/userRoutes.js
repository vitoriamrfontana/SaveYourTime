const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Mapeamento das rotas do módulo Perfil
router.get('/user', UserController.getProfile);
router.put('/user', UserController.updateProfile);

module.exports = router;
