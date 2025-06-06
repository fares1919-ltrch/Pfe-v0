const mongoose = require("mongoose");

const Notification = mongoose.model(
  "Notification",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
      },
      type: {
        type: String,
        enum: ["appointment", "request_status", "document", "system"],
        required: true
      },
      title: {
        type: String,
        required: true
      },
      message: {
        type: String,
        required: true
      },
      read: {
        type: Boolean,
        default: false
      },
      metadata: {
        appointmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment"
        },
        requestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CpfRequest"
        },
        documentId: String
      },
      createdAt: {
        type: Date,
        default: Date.now,
        index: true
      }
    },
    {
      timestamps: true,
      indexes: [
        { userId: 1, read: 1 },
        { userId: 1, createdAt: -1 }
      ]
    }
  )
);

module.exports = Notification;
