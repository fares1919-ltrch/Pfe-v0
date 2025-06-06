const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.refreshToken = require("./refreshToken.model");
db.cpfCredential = require("./cpfCredential.model");
db.appointment = require("./appointment.model");
db.biometric = require("./biometric.model");
db.notification = require("./notification.model");
db.center = require("./center.model");
db.centerSchedule = require("./centerSchedule.model");

db.ROLES = ["user", "admin", "officer", "manager"];

module.exports = db;
