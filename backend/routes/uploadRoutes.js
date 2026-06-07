const express = require('express');
const router = express.Router();
const {
  uploadProfilePhoto,
  deleteProfilePhoto,
  uploadNgoDocument,
  deleteNgoDocument,
  uploadFoodImage,
  deleteFoodImage
} = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage, uploadDocument } = require('../middleware/uploadMiddleware');

const rateLimiter = require('../middleware/rateLimiter');

// Rate limit upload endpoints: max 50 uploads per 15 minutes
const uploadLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many uploads from this IP. Please try again after 15 minutes.'
});

// NGO verification document routes (public to allow upload during registration)
router.post('/ngo-document', uploadLimiter, uploadDocument.single('document'), uploadNgoDocument);
router.delete('/ngo-document/:publicId', deleteNgoDocument);
router.delete('/ngo-document', deleteNgoDocument); // Fallback for query parameters

// All other file uploads require authentication
router.use(protect);

// Profile photo routes
router.post('/profile-photo', uploadLimiter, uploadImage.single('image'), uploadProfilePhoto);
router.delete('/profile-photo', deleteProfilePhoto);

// Food Listing image routes
router.post('/food-image', uploadLimiter, uploadImage.single('image'), uploadFoodImage);
router.delete('/food-image/:publicId', deleteFoodImage);
router.delete('/food-image', deleteFoodImage); // Fallback for query parameters

module.exports = router;
