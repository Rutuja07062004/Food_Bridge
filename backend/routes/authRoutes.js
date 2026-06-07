const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, getMe, updateProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const rateLimiter = require('../middleware/rateLimiter');

// Rate limit auth endpoints: max 30 attempts per 15 minutes
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
