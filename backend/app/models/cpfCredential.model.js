const mongoose = require("mongoose");

const CpfCredential = mongoose.model(
  "CpfCredential",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
      },
      biometricId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Biometric",
        required: true,
      },
      credentialNumber: {
        type: String,
        required: true,
        unique: true,
      },
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Officer who issued the credential
        required: true,
      },
      issuedAt: {
        type: Date,
        default: Date.now,
      },
      validUntil: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ["active", "expired", "revoked"],
        default: "active",
      },
    },
    {
      timestamps: true,
    }
  )
);

module.exports = CpfCredential;
