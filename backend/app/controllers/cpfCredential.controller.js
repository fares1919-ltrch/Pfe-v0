const db = require("../models");
const CpfCredential = db.cpfCredential;
const User = db.user;
const BiometricData = db.biometricData;
const Appointment = db.appointment;
const crypto = require("crypto");
const moment = require("moment");

/************************************************
 * CREDENTIAL CREATION AND RETRIEVAL
 * Issue and retrieve CPF credentials
 ************************************************/
// Issue a new CPF credential
exports.issueCpfCredential = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Verify appointment exists and is completed
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).send({ message: "Appointment not found" });
      }
      if (appointment.status !== "completed") {
        return res.status(400).send({
          message: "Cannot issue credential: appointment is not completed",
        });
      }
    }

    // Check if user already has a credential
    const existingCredential = await CpfCredential.findOne({ userId });
    if (existingCredential) {
      return res.status(400).send({
        message: "User already has a CPF credential",
      });
    }

    // Generate new credential number
    const cpfNumber = generateCpfNumber();

    // Create new credential
    const credential = new CpfCredential({
      userId,
      appointmentId,
      cpfNumber,
      status: "active",
      issuedBy: req.userId,
      issuedDate: new Date(),
      expiryDate: moment().add(10, "years").toDate(),
    });

    // Save credential
    const savedCredential = await credential.save();

    res.status(201).send(savedCredential);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get user's CPF credential
exports.getCpfCredential = async (req, res) => {
  try {
    const credential = await CpfCredential.findOne({
      userId: req.params.userId,
    }).populate("userId");

    if (!credential) {
      return res.status(404).send({ message: "CPF credential not found" });
    }

    // Check authorization
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map((role) => role.name);

    if (
      !roles.includes("officer") &&
      credential.userId.toString() !== req.userId
    ) {
      return res.status(403).send({
        message: "Not authorized to view this credential",
      });
    }

    res.send(credential);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * CREDENTIAL VALIDATION AND MANAGEMENT
 * Verify, revoke, and manage CPF credentials
 ************************************************/
// Verify CPF credential authenticity
exports.verifyCpfCredential = async (req, res) => {
  try {
    const credential = await CpfCredential.findById(req.params.id);

    if (!credential) {
      return res.status(404).send({ message: "CPF credential not found" });
    }

    // Check if credential is still valid
    const isValid = moment().isBefore(moment(credential.expiryDate));

    // Verify biometric data if available
    const biometricData = await BiometricData.findOne({
      userId: credential.userId,
    });
    const biometricVerified = biometricData ? true : false;

    res.send({
      valid: isValid,
      status: credential.status,
      biometricVerified,
      expiryDate: credential.expiryDate,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Revoke CPF credential
exports.revokeCpfCredential = async (req, res) => {
  try {
    const { reason } = req.body;
    const credential = await CpfCredential.findById(req.params.id);

    if (!credential) {
      return res.status(404).send({ message: "CPF credential not found" });
    }

    // Check authorization
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map((role) => role.name);

    if (!roles.includes("officer")) {
      return res.status(403).send({
        message: "Not authorized to revoke credentials",
      });
    }

    // Update credential status
    credential.status = "revoked";
    credential.revokedBy = req.userId;
    credential.revokedDate = new Date();
    credential.revocationReason = reason;

    await credential.save();

    res.send({ message: "CPF credential revoked successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * CREDENTIAL STATISTICS
 * Get statistics about issued credentials
 ************************************************/
// Get CPF credential statistics
exports.getCredentialStats = async (req, res) => {
  try {
    // Only officers can view stats
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map((role) => role.name);

    if (!roles.includes("officer")) {
      return res
        .status(403)
        .send({ message: "Not authorized to view statistics" });
    }

    const [total, active, revoked, issuedToday] = await Promise.all([
      CpfCredential.countDocuments(),
      CpfCredential.countDocuments({ status: "active" }),
      CpfCredential.countDocuments({ status: "revoked" }),
      CpfCredential.countDocuments({
        issuedDate: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    res.send({
      total,
      active,
      revoked,
      issuedToday,
      lastUpdated: new Date(),
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * HELPER FUNCTIONS
 * Utility functions for credential operations
 ************************************************/
// Helper function to generate CPF number
function generateCpfNumber() {
  // Generate random 9 digits
  let cpf = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0");

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let firstDigit = (sum * 10) % 11;
  firstDigit = firstDigit === 10 ? 0 : firstDigit;
  cpf += firstDigit;

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let secondDigit = (sum * 10) % 11;
  secondDigit = secondDigit === 10 ? 0 : secondDigit;
  cpf += secondDigit;

  return cpf;
}
