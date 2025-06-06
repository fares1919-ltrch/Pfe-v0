require("dotenv").config();

module.exports = {
  HOST: process.env.DB_HOST || "localhost",
  PORT: process.env.DB_PORT || 27017,
  DB: process.env.DB_NAME || "fares_db",
};
