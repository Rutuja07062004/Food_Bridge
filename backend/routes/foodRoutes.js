const express = require('express');
const router = express.Router();
const {
  createFood,
  getFoods,
  getFoodById,
  updateFood,
  deleteFood,
  completeFood,
  getDonorStats,
  getDonorAnalytics,
  getNearbyFood,
} = require('../controllers/foodController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');

// Donor stats — must come BEFORE /:id routes to avoid param collision
router.get('/donor/stats', protect, authorize('Donor'), getDonorStats);
router.get('/donor/analytics', protect, authorize('Donor'), getDonorAnalytics);
router.get('/nearby', protect, getNearbyFood);

router.route('/')
  .post(protect, authorize('Donor'), uploadImage.single('image'), createFood)
  .get(getFoods);

router.route('/:id')
  .get(getFoodById)
  .put(protect, uploadImage.single('image'), updateFood)
  .delete(protect, deleteFood);

router.patch('/:id/complete', protect, completeFood);

module.exports = router;
