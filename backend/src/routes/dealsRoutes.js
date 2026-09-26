const express = require('express');
const router = express.Router();
const DealsController = require('../controllers/dealsController');

router.get('/search', DealsController.searchDeals);
router.get('/featured', DealsController.getFeaturedDeals);

module.exports = router;