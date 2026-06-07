const express = require('express');
const router = express.Router();
const {
  claimFood,
  getClaims,
  getClaimById,
  approveClaim,
  rejectClaim,
  schedulePickup,
  markCollected,
  confirmCompletion
} = require('../controllers/claimsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.route('/')
  .post(claimFood)
  .get(getClaims);

router.get('/my-claims', getClaims);

router.route('/:id')
  .get(getClaimById);

router.put('/:id/approve', approveClaim);
router.put('/:id/reject', rejectClaim);
router.put('/:id/schedule-pickup', schedulePickup);
router.put('/:id/mark-collected', markCollected);
router.put('/:id/confirm-completion', confirmCompletion);

module.exports = router;
