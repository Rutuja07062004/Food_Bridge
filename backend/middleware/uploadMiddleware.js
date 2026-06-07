const multer = require('multer');

// Store files in memory so buffers are accessible for Cloudinary stream uploads
const storage = multer.memoryStorage();

/**
 * Image Validator (JPG, JPEG, PNG, WEBP, up to 5MB)
 */
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed!'), false);
  }
};

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

/**
 * Document Validator (PDF, JPG, JPEG, PNG, up to 10MB)
 */
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, JPG, JPEG, and PNG documents are allowed!'), false);
  }
};

const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

module.exports = {
  uploadImage,
  uploadDocument
};
