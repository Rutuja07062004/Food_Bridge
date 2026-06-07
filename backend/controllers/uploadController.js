const User = require('../models/User');
const cloudinaryService = require('../services/cloudinaryService');

/**
 * @desc    Upload profile photo & update User record
 * @route   POST /api/upload/profile-photo
 * @access  Private
 */
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete existing profile photo from Cloudinary if it exists
    if (user.profilePhoto?.publicId) {
      try {
        await cloudinaryService.deleteAsset(user.profilePhoto.publicId);
      } catch (err) {
        console.warn('Failed to delete old profile photo:', err);
      }
    }

    // Upload new photo
    const uploadResult = await cloudinaryService.uploadProfilePhoto(req.file);

    // Save to User model
    user.profilePhoto = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: user.profilePhoto
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete profile photo & clear User record
 * @route   DELETE /api/upload/profile-photo
 * @access  Private
 */
exports.deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.profilePhoto || !user.profilePhoto.publicId) {
      return res.status(400).json({ success: false, message: 'No profile photo found to delete' });
    }

    // Delete from Cloudinary
    await cloudinaryService.deleteAsset(user.profilePhoto.publicId);

    // Clear DB fields
    user.profilePhoto = { url: '', publicId: '' };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Upload NGO Verification Document
 * @route   POST /api/upload/ngo-document
 * @access  Private (NGO only)
 */
exports.uploadNgoDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded' });
    }

    // Upload file
    const uploadResult = await cloudinaryService.uploadNgoDocument(req.file);

    res.status(200).json({
      success: true,
      message: 'NGO document uploaded successfully',
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete NGO Verification Document
 * @route   DELETE /api/upload/ngo-document/:publicId
 * @access  Private (NGO/Admin)
 */
exports.deleteNgoDocument = async (req, res) => {
  try {
    // Read from params or query (in case publicId contains slash pathing)
    const publicId = req.params.publicId || req.query.publicId;
    
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId parameter is required' });
    }

    const isPdf = publicId.toLowerCase().endsWith('.pdf') || publicId.includes('documents/');
    const resourceType = isPdf ? 'raw' : 'image';

    const result = await cloudinaryService.deleteAsset(publicId, resourceType);

    res.status(200).json({
      success: true,
      message: 'NGO document deleted successfully',
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Upload Food listing image
 * @route   POST /api/upload/food-image
 * @access  Private (Donor only)
 */
exports.uploadFoodImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const uploadResult = await cloudinaryService.uploadFoodImage(req.file);

    res.status(200).json({
      success: true,
      message: 'Food listing image uploaded successfully',
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete Food listing image
 * @route   DELETE /api/upload/food-image/:publicId
 * @access  Private (Donor/Admin)
 */
exports.deleteFoodImage = async (req, res) => {
  try {
    const publicId = req.params.publicId || req.query.publicId;

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId parameter is required' });
    }

    const result = await cloudinaryService.deleteAsset(publicId, 'image');

    res.status(200).json({
      success: true,
      message: 'Food listing image deleted successfully',
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
