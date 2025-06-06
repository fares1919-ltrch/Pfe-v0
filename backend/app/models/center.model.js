const mongoose = require("mongoose");

const Center = mongoose.model(
  "Center",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      lon: {
        type: Number,
        required: true,
      },
      lat: {
        type: Number,
        required: true,
      },
    },
    region: {
      type: String,
      required: true,
    },
    capacity: {
      daily: {
        type: Number,
        required: true,
      },
      hourly: {
        type: Number,
        required: true,
      },
    },
    workingHours: {
      monday: {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
      tuesday: {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
      wednesday: {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
      thursday: {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
      friday: {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
      saturday: {
        start: String,
        end: String,
      },
      sunday: {
        start: String,
        end: String,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    contact: {
      phone: String,
      email: String,
    },
    services: [
      {
        type: String,
        enum: ["cpf", "biometric", "document"],
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  })
);

module.exports = Center;
