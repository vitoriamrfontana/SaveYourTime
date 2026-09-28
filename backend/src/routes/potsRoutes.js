const express = require('express');
const PotsController = require('../controllers/potsController');

const router = express.Router();

router.get('/', PotsController.getResumo);
router.get('/lancamentos', PotsController.listarLancamentos);
router.post('/lancamento', PotsController.criarLancamento);
router.delete('/lancamento/:id', PotsController.removerLancamento);

module.exports = router;
