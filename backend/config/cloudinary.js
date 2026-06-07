const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const configureCloudinary = () => {
  const isConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary initialized successfully.');
  } else {
    console.warn('⚠️  Cloudinary environment variables missing. Falling back to local/uploads mock storage.');
  }
};

module.exports = {
  cloudinary,
  configureCloudinary,
  isCloudinaryConfigured: () => !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
};
