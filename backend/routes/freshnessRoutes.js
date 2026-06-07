const express = require('express');
const router = express.Router();
const { predictFreshness, getFreshnessByFoodId } = require('../controllers/freshnessController');
const { protect } = require('../middleware/authMiddleware');

// All prediction API routes require authentication
router.use(protect);

router.post('/predict', predictFreshness);
router.get('/:foodId', getFreshnessByFoodId);

module.exports = router;
