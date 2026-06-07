const express = require('express');
const router = express.Router();
const { claimFood, getClaims, updateClaimStatus } = require('../controllers/claimController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // All claim routes require authentication

router.route('/')
  .post(authorize('NGO'), claimFood)
  .get(getClaims);

router.patch('/:id/status', updateClaimStatus);

module.exports = router;
