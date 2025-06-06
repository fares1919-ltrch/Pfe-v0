const db = require("../models");
const Biometric = db.biometric;
const Appointment = db.appointment;
const Center = db.center;

// Get appointment statistics
const getAppointmentRequestStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query);
    const stats = {
      total: appointments.length,
      approved: appointments.filter((a) => a.status === "validated").length,
      rejected: appointments.filter((a) => a.status === "rejected").length,
      pending: appointments.filter((a) => a.status === "pending").length,
      completed: appointments.filter((a) => a.status === "completed").length,
    };

    res.send(stats);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get biometric data statistics
const getBiometricStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const biometrics = await Biometric.find(query);

    // Count items with non-null/undefined fingerprints and iris images
    const withFingerprints = biometrics.filter((b) => {
      return Object.values(b.imageFingerprints).some(
        (v) => v !== null && v !== undefined
      );
    }).length;

    const withIris = biometrics.filter((b) => {
      return Object.values(b.imageIris).some(
        (v) => v !== null && v !== undefined
      );
    }).length;

    const stats = {
      total: biometrics.length,
      withFingerprints,
      withFace: biometrics.filter((b) => b.imageFace).length,
      withIris,
    };

    res.send(stats);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get appointment statistics
const getAppointmentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query);
    const stats = {
      total: appointments.length,
      completed: appointments.filter((a) => a.status === "completed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
      noShow: appointments.filter((a) => a.status === "no-show").length,
      rescheduled: appointments.filter((a) => a.rescheduledFrom).length,
    };

    res.send(stats);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get regional statistics
const getRegionalStats = async (req, res) => {
  try {
    const centers = await Center.find();
    const regions = [...new Set(centers.map((c) => c.region))];
    const stats = [];

    for (const region of regions) {
      const centerIds = centers
        .filter((c) => c.region === region)
        .map((c) => c.id);
      const appointments = await Appointment.find({
        centerId: { $in: centerIds },
      });

      stats.push({
        region,
        centers: centerIds.length,
        appointments: appointments.length,
        completed: appointments.filter((a) => a.status === "completed").length,
      });
    }

    res.send(stats);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get system overview statistics
const getSystemOverview = async (req, res) => {
  try {
    const [appointments, centers, biometrics] = await Promise.all([
      Appointment.countDocuments(),
      Center.countDocuments(),
      Biometric.countDocuments(),
    ]);

    res.send({
      totalAppointments: appointments,
      totalCenters: centers,
      totalBiometrics: biometrics,
      lastUpdated: new Date(),
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

module.exports = {
  getAppointmentRequestStats,
  getBiometricStats,
  getAppointmentStats,
  getRegionalStats,
  getSystemOverview,
};
