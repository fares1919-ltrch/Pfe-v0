const jwt = require("jsonwebtoken");
const { TokenExpiredError } = jwt;
const config = require("../config/auth.config.js");
const mongoose = require("mongoose");
const User = require("../models/user.model");

const catchError = (err, res) => {
  if (err instanceof TokenExpiredError) {
    return res
      .status(401)
      .json({ message: "Unauthorized! Access Token was expired!" });
  }
  return res.status(401).json({ message: "Unauthorized!" });
};

const verifyToken = (req, res, next) => {
  // Check for token in Authorization header first
  let token = req.headers.authorization?.split(" ")[1];

  // If not in Authorization header, check other locations
  if (!token) {
    token =
      req.headers["x-access-token"] ||
      (req.cookies ? req.cookies.token : null) ||
      (req.session ? req.session.token : null);
  }

  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.id;

    // Refresh token if it's about to expire (within 5 minutes)
    if (decoded.exp - Date.now() / 1000 < 300) {
      const newToken = jwt.sign({ id: decoded.id }, config.jwtSecret, {
        expiresIn: "24h",
      });
      res.cookie("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
      req.session.token = newToken;
    }

    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(401).json({ message: "Invalid token" });
    }

    next();
  } catch (err) {
    return catchError(err, res);
  }
};

const isManager = async (req, res, next) => {
  try {
    // Find the user and populate their roles
    const user = await User.findById(req.userId).populate("roles");

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Check if user has manager role using some()
    const isManagerRole = user.roles.some((role) => role.name === "manager");

    if (isManagerRole) {
      return next();
    }

    res.status(403).send({
      message: "Require Manager Role!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "An error occurred checking manager role",
    });
  }
};

const isOfficer = async (req, res, next) => {
  try {
    // Find the user and populate their roles
    const user = await User.findById(req.userId).populate("roles");

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Check if user has officer role using some()
    const isOfficerRole = user.roles.some((role) => role.name === "officer");

    if (isOfficerRole) {
      req.isOfficer = true;
      return next();
    }

    res.status(403).send({
      message: "Require Officer Role!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "An error occurred checking officer role",
    });
  }
};

const isManagerOrOfficer = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map((role) => role.name);

    if (roles.includes("manager") || roles.includes("officer")) {
      next();
      return;
    }

    res.status(403).send({ message: "Require Manager or Officer Role!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const authJwt = {
  verifyToken,
  isManager,
  isOfficer,
  isManagerOrOfficer,
};

module.exports = authJwt;
