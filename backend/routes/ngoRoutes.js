const express = require('express');
const router = express.Router();
const { registerNGO, loginNGO, getNGOProfile, updateNGOProfile } = require('../controllers/ngoController');
const { protect } = require('../middleware/authMiddleware');

const rateLimiter = require('../middleware/rateLimiter');

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

// Public routes
router.post('/register', authLimiter, registerNGO);
router.post('/login', authLimiter, loginNGO);

// Protected routes (NGO only)
router.route('/profile')
  .get(protect, getNGOProfile)
  .put(protect, updateNGOProfile);

module.exports = router;
