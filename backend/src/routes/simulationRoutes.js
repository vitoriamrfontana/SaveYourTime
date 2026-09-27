const express = require('express');
const router = express.Router();
const SimulationController = require('../controllers/simulationController');

router.post('/', SimulationController.simular);
router.get('/history', SimulationController.getHistorico);
router.delete('/history/:id', SimulationController.deletarHistoricoItem);
router.patch('/history/:id/status', SimulationController.atualizarStatus);
router.get('/health-score', SimulationController.getHealthScore);

module.exports = router;
