const mongoose = require("mongoose");

const Biometric = mongoose.model(
  "Biometric",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      imageFace: {
        type: String, // Path to the face image file
      },
      imageIris: {
        leftIris: { type: String }, // Path to left iris image
        rightIris: { type: String }  // Path to right iris image
      },
      imageFingerprints: {
        rightThumb: { type: String },
        rightIndex: { type: String },
        rightMiddle: { type: String },
        rightRing: { type: String },
        rightLittle: { type: String },
        leftThumb: { type: String },
        leftIndex: { type: String },
        leftMiddle: { type: String },
        leftRing: { type: String },
        leftLittle: { type: String }
      }
    },
    {
      timestamps: true,
    }
  )
);

module.exports = Biometric; 