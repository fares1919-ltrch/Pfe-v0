const db = require("../models");
const User = db.user;
const Biometric = db.biometric;
const Appointment = db.appointment;
const biometricConfig = require('../config/biometric.config');

// Controller to create a new biometric entry
exports.createBiometric = async (req, res) => {
  try {
    console.log("Processing biometric submission");
    console.log("Request files:", Object.keys(req.files || {}));
    console.log("Request body:", req.body);
    
    // Verify userId exists in request
    if (!req.body.userId) {
      // Clean up any uploaded files
      await biometricConfig.cleanupUploadedFiles(req.files);
      return res.status(400).json({ message: "UserId is required" });
    }

    // Check if user exists
    const user = await User.findById(req.body.userId);
    if (!user) {
      // Clean up any uploaded files
      await biometricConfig.cleanupUploadedFiles(req.files);
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if biometric data already exists for this user
    const existingBiometric = await Biometric.findOne({ userId: req.body.userId });
    if (existingBiometric) {
      // Clean up any uploaded files
      await biometricConfig.cleanupUploadedFiles(req.files);
      return res.status(409).json({ 
        message: "Biometric data already exists for this user",
        biometricId: existingBiometric._id
      });
    }

    console.log("Preparing to process uploaded files");
    
    // Check if any files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded" });
    }

    // Process face image
    let faceImagePath = null;
    if (req.files.imageFace && req.files.imageFace.length > 0) {
      faceImagePath = req.files.imageFace[0].path;
      console.log("Face image path:", faceImagePath);
    }
    
    // Initialize iris and fingerprint objects
    const irisImages = {
      leftIris: null,
      rightIris: null
    };
    
    const fingerprintImages = {
      rightThumb: null,
      rightIndex: null,
      rightMiddle: null,
      rightRing: null,
      rightLittle: null,
      leftThumb: null,
      leftIndex: null,
      leftMiddle: null,
      leftRing: null,
      leftLittle: null
    };
    
    // Process iris images
    if (req.files.imageIrisLeft && req.files.imageIrisLeft.length > 0) {
      irisImages.leftIris = req.files.imageIrisLeft[0].path;
      console.log("Left iris image path:", irisImages.leftIris);
    }
    
    if (req.files.imageIrisRight && req.files.imageIrisRight.length > 0) {
      irisImages.rightIris = req.files.imageIrisRight[0].path;
      console.log("Right iris image path:", irisImages.rightIris);
    }
    
    // Process fingerprint images
    const fingerprintMapping = {
      imageFingerprintRightThumb: 'rightThumb',
      imageFingerprintRightIndex: 'rightIndex',
      imageFingerprintRightMiddle: 'rightMiddle',
      imageFingerprintRightRing: 'rightRing',
      imageFingerprintRightLittle: 'rightLittle',
      imageFingerprintLeftThumb: 'leftThumb',
      imageFingerprintLeftIndex: 'leftIndex',
      imageFingerprintLeftMiddle: 'leftMiddle',
      imageFingerprintLeftRing: 'leftRing',
      imageFingerprintLeftLittle: 'leftLittle'
    };
    
    // Loop through all fingerprint fields and set values if they exist
    Object.entries(fingerprintMapping).forEach(([fieldName, propertyName]) => {
      if (req.files[fieldName] && req.files[fieldName].length > 0) {
        fingerprintImages[propertyName] = req.files[fieldName][0].path;
        console.log(`${fieldName} path:`, fingerprintImages[propertyName]);
      }
    });
    
    console.log("Creating biometric database entry");
    
    // Create new biometric entry
    const biometric = new Biometric({
      userId: req.body.userId,
      imageFace: faceImagePath,
      imageIris: irisImages,
      imageFingerprints: fingerprintImages
    });
    console.log("biometric userId", req.body.userId);
    const appointment = await Appointment.findOne({ userId: req.body.userId });
    appointment.status = "completed"; 
    await appointment.save(); 
   
    // Save biometric data
    const savedBiometric = await biometric.save();
    console.log("Biometric entry saved successfully");
    
    // Update user with biometric reference
    user.biometric = savedBiometric._id;
    await user.save();
    console.log("User updated with biometric reference");
    
    // Count non-null fingerprints
    const fingerprintCount = Object.values(savedBiometric.imageFingerprints)
      .filter(value => value !== null && value !== undefined).length;
    
    // Count non-null iris images
    const irisCount = Object.values(savedBiometric.imageIris)
      .filter(value => value !== null && value !== undefined).length;
    
    res.status(201).json({
      message: "Biometric data uploaded successfully",
      data: {
        id: savedBiometric._id,
        userId: savedBiometric.userId,
        faceImage: savedBiometric.imageFace ? true : false,
        irisCount: irisCount,
        fingerprintCount: fingerprintCount,
        createdAt: savedBiometric.createdAt
      }
    });
  } catch (err) {
    console.error("Error in createBiometric:", err);
    
    // Clean up any uploaded files in case of error
    await biometricConfig.cleanupUploadedFiles(req.files);
    
    res.status(500).json({
      message: "Error uploading biometric data",
      error: err.message
    });
  }
};

// Get biometric data for a user
exports.getBiometricByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const biometric = await Biometric.findOne({ userId });
    
    if (!biometric) {
      return res.status(404).json({ message: "Biometric data not found for this user" });
    }
    
    // Count non-null fingerprints
    const fingerprintCount = Object.values(biometric.imageFingerprints)
      .filter(value => value !== null && value !== undefined).length;
    
    // Count non-null iris images
    const irisCount = Object.values(biometric.imageIris)
      .filter(value => value !== null && value !== undefined).length;
    
    res.status(200).json({
      id: biometric._id,
      userId: biometric.userId,
      faceImage: biometric.imageFace ? true : false,
      irisCount: irisCount,
      fingerprintCount: fingerprintCount,
      createdAt: biometric.createdAt,
      updatedAt: biometric.updatedAt
    });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving biometric data",
      error: err.message
    });
  }
};

// Export middleware for handling biometric uploads
exports.uploadBiometricImages = biometricConfig.uploadBiometricImages.bind(biometricConfig); 