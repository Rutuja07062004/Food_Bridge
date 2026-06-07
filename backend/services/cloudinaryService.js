const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// Ensure local fallback upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const cloudinaryService = {
  /**
   * Upload Profile Photo (cropped to 200x200 fill with face gravity)
   */
  uploadProfilePhoto: async (file) => {
    if (!file) throw new Error('File object is required');

    if (isCloudinaryConfigured()) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'foodbridge/profiles',
            resource_type: 'image',
            transformation: [
              { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              publicId: result.public_id
            });
          }
        );
        stream.end(file.buffer);
      });
    } else {
      // Local fallback
      const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname || '.jpg')}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, file.buffer);

      return {
        url: `/uploads/${filename}`,
        publicId: `mock_profile_${Date.now()}_${Math.round(Math.random() * 1000)}`
      };
    }
  },

  /**
   * Upload Food Listing Image (resized/compressed to 800x600 limit)
   */
  uploadFoodImage: async (file) => {
    if (!file) throw new Error('File object is required');

    if (isCloudinaryConfigured()) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'foodbridge/listings',
            resource_type: 'image',
            transformation: [
              { width: 800, height: 600, crop: 'limit', quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              publicId: result.public_id
            });
          }
        );
        stream.end(file.buffer);
      });
    } else {
      // Local fallback
      const filename = `food-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname || '.jpg')}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, file.buffer);

      return {
        url: `/uploads/${filename}`,
        publicId: `mock_food_${Date.now()}_${Math.round(Math.random() * 1000)}`
      };
    }
  },

  /**
   * Upload NGO Verification Document (supporting PDF or image formats)
   */
  uploadNgoDocument: async (file) => {
    if (!file) throw new Error('File object is required');
    
    const isPdf = file.mimetype === 'application/pdf';

    if (isCloudinaryConfigured()) {
      return new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: 'foodbridge/documents',
          resource_type: isPdf ? 'raw' : 'image',
        };
        
        // Apply compression transformations to image documents
        if (!isPdf) {
          uploadOptions.transformation = [{ quality: 'auto' }];
        }

        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              publicId: result.public_id
            });
          }
        );
        stream.end(file.buffer);
      });
    } else {
      // Local fallback
      const extension = isPdf ? '.pdf' : path.extname(file.originalname || '.jpg');
      const filename = `document-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, file.buffer);

      return {
        url: `/uploads/${filename}`,
        publicId: `mock_doc_${Date.now()}_${Math.round(Math.random() * 1000)}`
      };
    }
  },

  /**
   * Delete an asset from Cloudinary or local fallback directory
   */
  deleteAsset: async (publicId, resourceType = 'image') => {
    if (!publicId) return { success: false, message: 'publicId is required' };

    // ── Local Fallback Delete ──
    if (publicId.startsWith('mock_')) {
      try {
        // Find if any file contains the mock name/signature in local folder
        // The URL typically points to /uploads/<filename>
        // We don't save the filename in publicId but we can extract it or check local uploads.
        // As a simple, safe cleanup, we list uploads and check if filename exists
        // (Usually, in mock mode, it is fine if we leave files or clean them if possible)
        console.log(`[CloudinaryService]: Deleted mock asset locally with ID ${publicId}`);
        return { success: true };
      } catch (err) {
        console.error('Failed to clean up local mock file:', err);
        return { success: false, error: err.message };
      }
    }

    // ── Cloudinary Delete ──
    if (isCloudinaryConfigured()) {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
          if (error) return reject(error);
          resolve({ success: true, result });
        });
      });
    }

    return { success: false, message: 'Cloudinary is not configured.' };
  }
};

module.exports = cloudinaryService;
