const express = require('express');
const router = express.Router();
const DealsController = require('../controllers/dealsController');

router.get('/search', DealsController.searchDeals);
router.get('/featured', DealsController.getFeaturedDeals);
router.get('/alerts', DealsController.getPriceAlerts);
router.post('/alerts', DealsController.createPriceAlert);
router.delete('/alerts/:id', DealsController.deletePriceAlert);
router.get('/:id/history', DealsController.getPriceHistory);

module.exports = router;
