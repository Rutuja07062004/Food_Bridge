const express = require('express');
const router = express.Router();
const {
  getMapsConfig,
  autocompleteAddress,
  resolveLocation,
  getDirections
} = require('../controllers/mapController');
const { protect } = require('../middleware/authMiddleware');

// Secure all maps API routes with JWT protection
router.use(protect);

router.get('/config', getMapsConfig);
router.get('/autocomplete', autocompleteAddress);
router.post('/location', resolveLocation);
router.get('/directions', getDirections);

module.exports = router;
