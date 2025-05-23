const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Champs d'authentification
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Informations personnelles
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    // Adresse
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: {
        type: String,
        default: "Brazil",
      },
    },

    // Contact
    phone: String,

    // Rôles et statut
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    status: {
      type: String,
      enum: ["active", "suspended", "blocked"],
      default: "active",
    },

    // Vérification du compte
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Réinitialisation du mot de passe
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Données biométriques (références)
    biometricData: {
      face: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BiometricData",
      },
      fingerprints: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BiometricData",
      },
      iris: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BiometricData",
      },
    },

    // Informations CPF
    cpf: {
      number: {
        type: String,
        sparse: true,
        unique: true,
      },
      status: {
        type: String,
        enum: ["pending", "generated", "blocked"],
        default: "pending",
      },
      issueDate: Date,
      expiryDate: Date,
    },

    // Statut de déduplication
    deduplicationStatus: {
      type: String,
      enum: ["not_started", "in_progress", "verified", "duplicate_found"],
      default: "not_started",
    },

    // Timestamps
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
);

const User = mongoose.model("User", userSchema);

module.exports = User;
