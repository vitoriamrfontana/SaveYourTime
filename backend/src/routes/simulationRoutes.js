const express = require('express');
const router = express.Router();
const SimulationController = require('../controllers/simulationController');

router.post('/', SimulationController.simular);
router.get('/history', SimulationController.getHistorico);
router.delete('/history/:id', SimulationController.deletarHistoricoItem);
router.patch('/history/:id/status', SimulationController.atualizarStatus);
router.get('/health-score', SimulationController.getHealthScore);
router.get('/analytics/timeline', SimulationController.getEvolucaoHealthScore);
router.get('/badges', SimulationController.getConquistas);
router.post('/goals', SimulationController.criarMetaLiberdade);
router.get('/goals', SimulationController.getMetasProgresso);
router.post('/goals/:id/deposit', SimulationController.aportarMeta);
router.post('/goals/impact', SimulationController.simularImpactoMeta);

module.exports = router;
