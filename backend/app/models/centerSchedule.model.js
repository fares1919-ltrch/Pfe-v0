const mongoose = require("mongoose");

const dayScheduleSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  openingTime: {
    type: String, // HH:MM format
    required: true
  },
  closingTime: {
    type: String, // HH:MM format
    required: true
  },
  reservedSlots: {
    type: Number,
    default: 0
  },
  reservedSlotsDetails: [{
    time: String, // HH:MM format
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }]
});

const centerScheduleSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true
    },
    month: {
      type: String, // YYYY-MM format
      required: true
    },
    slotDuration: {
      type: Number, // in minutes
      required: true,
      default: 10
    },
    days: [dayScheduleSchema]
  },
  {
    timestamps: true
  }
);

// Compound index for efficient lookups
centerScheduleSchema.index({ centerId: 1, month: 1 }, { unique: true });

const CenterSchedule = mongoose.model("CenterSchedule", centerScheduleSchema);

module.exports = CenterSchedule;
