const express = require('express');
const router = express.Router();
const DealsController = require('../controllers/dealsController');

router.get('/search', DealsController.searchDeals);
router.get('/featured', DealsController.getFeaturedDeals);
router.get('/audit/summary', DealsController.getRelatorioConsolidado);
router.get('/audit/export', DealsController.exportarExtratoPoupanca);
router.get('/alerts', DealsController.getPriceAlerts);
router.post('/alerts', DealsController.createPriceAlert);
router.delete('/alerts/:id', DealsController.deletePriceAlert);
router.get('/:id/history', DealsController.getPriceHistory);

module.exports = router;
