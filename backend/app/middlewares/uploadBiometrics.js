const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/biometric.config');
const fs = require('fs').promises;

// Configure storage for different biometric types
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const type = file.fieldname.split('_')[0]; // e.g., 'fingerprint_right_thumb' -> 'fingerprint'
    const dir = config.storagePaths[type + 's']; // Add 's' for plural form

    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate a secure random filename
    crypto.randomBytes(16, (err, raw) => {
      if (err) return cb(err);

      // Preserve original extension
      cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
});

// File filter for biometric data
const fileFilter = (req, file, cb) => {
  const type = file.fieldname.split('_')[0];
  const allowedFormats = config.quality[type]?.allowedFormats || [];

  if (allowedFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed formats for ${type}: ${allowedFormats.join(', ')}`));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 15 // Maximum number of files per request
  }
});

// Middleware for handling biometric uploads
const uploadBiometrics = (req, res, next) => {
  const uploadFields = [
    // Fingerprints
    { name: 'fingerprint_right_thumb', maxCount: 1 },
    { name: 'fingerprint_right_index', maxCount: 1 },
    { name: 'fingerprint_right_middle', maxCount: 1 },
    { name: 'fingerprint_right_ring', maxCount: 1 },
    { name: 'fingerprint_right_little', maxCount: 1 },
    { name: 'fingerprint_left_thumb', maxCount: 1 },
    { name: 'fingerprint_left_index', maxCount: 1 },
    { name: 'fingerprint_left_middle', maxCount: 1 },
    { name: 'fingerprint_left_ring', maxCount: 1 },
    { name: 'fingerprint_left_little', maxCount: 1 },

    // Face photo
    { name: 'face', maxCount: 1 },

    // Iris scans
    { name: 'iris_right', maxCount: 1 },
    { name: 'iris_left', maxCount: 1 },

    // Supporting documents
    { name: 'document', maxCount: 5 }
  ];

  // Use multer fields upload
  upload.fields(uploadFields)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      return res.status(500).json({
        message: 'Server error during file upload',
        error: err.message
      });
    }

    // Add metadata about uploaded files to request
    req.biometricFiles = {};
    uploadFields.forEach(field => {
      if (req.files && req.files[field.name]) {
        req.biometricFiles[field.name] = req.files[field.name].map(file => ({
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        }));
      }
    });

    next();
  });
};

// Cleanup middleware for temporary files
const cleanupBiometricFiles = async (req, res, next) => {
  res.on('finish', async () => {
    try {
      if (req.biometricFiles) {
        for (const fieldFiles of Object.values(req.biometricFiles)) {
          for (const file of fieldFiles) {
            await fs.unlink(file.path).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up biometric files:', error);
    }
  });
  next();
};

module.exports = {
  uploadBiometrics,
  cleanupBiometricFiles
};
