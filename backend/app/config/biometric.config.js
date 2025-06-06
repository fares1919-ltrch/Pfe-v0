const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

module.exports = {
  // Image quality thresholds
  quality: {
    fingerprint: {
      minDPI: 500,
      maxDPI: 1000,
      minWidth: 500,
      minHeight: 500,
      maxSizeBytes: 2 * 1024 * 1024, // 2MB
      allowedFormats: ['image/jpeg', 'image/png', 'image/wsq']
    },
    face: {
      minWidth: 600,
      minHeight: 800,
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      allowedFormats: ['image/jpeg', 'image/png']
    },
    iris: {
      minWidth: 640,
      minHeight: 480,
      maxSizeBytes: 3 * 1024 * 1024, // 3MB
      allowedFormats: ['image/jpeg', 'image/png']
    }
  },

  // Storage paths for different types of biometric data
  storagePaths: {
    fingerprints: 'uploads/biometrics/fingerprints',
    faces: 'uploads/biometrics/faces',
    iris: 'uploads/biometrics/iris',
    documents: 'uploads/biometrics/documents'
  },

  // Validation rules
  validation: {
    requiredBiometrics: ['fingerprints', 'face'],
    optionalBiometrics: ['iris'],
    minFingerprintCount: 2, // Minimum number of fingerprints required
    maxRetries: 3 // Maximum attempts for capturing each biometric
  },

  // Security settings
  security: {
    encryptionAlgorithm: 'aes-256-gcm',
    saltRounds: 10,
    tokenExpiryHours: 24
  },

  // Processing settings
  processing: {
    imageCompression: true,
    compressionQuality: 0.8,
    autoRotate: true,
    enhanceContrast: true
  },

  // Define base path for uploads
  BASE_UPLOAD_PATH: 'app/middlewares/uploads/biometrics',

  // Configure storage for biometric image uploads
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      let type = '';
      
      // Determine the type of biometric data
      if (file.fieldname === 'imageFace') {
        type = 'faces';
      } else if (file.fieldname.startsWith('imageIris')) {
        type = 'iris';
      } else if (file.fieldname.startsWith('imageFingerprint')) {
        type = 'fingerprints';
      }
      
      // Create full path
      const dir = path.join('app/middlewares/uploads/biometrics', type);
      
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
  }),

  // File filter for biometric data
  fileFilter: (req, file, cb) => {
    let type = '';
    
    // Determine the type of biometric data
    if (file.fieldname === 'imageFace') {
      type = 'face';
    } else if (file.fieldname.startsWith('imageIris')) {
      type = 'iris';
    } else if (file.fieldname.startsWith('imageFingerprint')) {
      type = 'fingerprint';
    }
    
    const allowedFormats = module.exports.quality[type]?.allowedFormats || [];
    
    if (allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file format. Allowed formats for ${type}: ${allowedFormats.join(', ')}`));
    }
  },

  // Upload fields configuration
  uploadFields: [
    { name: 'imageFace', maxCount: 1 },
    { name: 'imageIrisLeft', maxCount: 1 },
    { name: 'imageIrisRight', maxCount: 1 },
    { name: 'imageFingerprintRightThumb', maxCount: 1 },
    { name: 'imageFingerprintRightIndex', maxCount: 1 },
    { name: 'imageFingerprintRightMiddle', maxCount: 1 },
    { name: 'imageFingerprintRightRing', maxCount: 1 },
    { name: 'imageFingerprintRightLittle', maxCount: 1 },
    { name: 'imageFingerprintLeftThumb', maxCount: 1 },
    { name: 'imageFingerprintLeftIndex', maxCount: 1 },
    { name: 'imageFingerprintLeftMiddle', maxCount: 1 },
    { name: 'imageFingerprintLeftRing', maxCount: 1 },
    { name: 'imageFingerprintLeftLittle', maxCount: 1 }
  ],

  // Create multer upload instance
  getUploadInstance: function() {
    return multer({
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 13 // 1 face + 2 iris + 10 fingerprints
      }
    });
  },

  // Middleware for handling biometric uploads
  uploadBiometricImages: function(req, res, next) {
    const upload = this.getUploadInstance();
    upload.fields(this.uploadFields)(req, res, (err) => {
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
      next();
    });
  },

  // Helper function to clean up uploaded files
  cleanupUploadedFiles: async function(files) {
    try {
      if (!files) return;
      
      // Iterate through all file fields
      for (const fieldFiles of Object.values(files)) {
        // Iterate through files in each field
        for (const file of fieldFiles) {
          if (file && file.path) {
            await fs.unlink(file.path).catch(() => {
              // Ignore errors during cleanup
              console.log(`Failed to delete file: ${file.path}`);
            });
          }
        }
      }
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }
  }
};
