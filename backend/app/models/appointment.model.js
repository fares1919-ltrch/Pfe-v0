const mongoose = require("mongoose");

const Appointment = mongoose.model(
  "Appointment",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      officerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false, // Assigned on validation
      },
      centerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Center",
        required: true,
      },
      appointmentDate: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: [
          "pending",
          "validated",
          "rejected",
          "completed",
          "missed",
          "cancelled",
        ],
        default: "pending",
      },
      cpfGenerationStatus: {
        type: String,
        enum: ["pending", "generated", "fraudulent"],
        default: "pending",
      },
      cost: {
        type: String,
        default: "7.09 BRL",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  )
);

module.exports = Appointment;
