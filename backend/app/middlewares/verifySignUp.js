const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Check for existing username
    const existingUsername = await User.findOne({
      username: req.body.username,
    });

    if (existingUsername) {
      return res.status(400).send({
        message: "Failed! Username is already in use!",
      });
    }

    // Check for existing email
    const existingEmail = await User.findOne({
      email: req.body.email,
    });

    if (existingEmail) {
      return res.status(400).send({
        message: "Failed! Email is already in use!",
      });
    }

    // If no duplicates found, proceed to next middleware
    next();
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "An error occurred during username/email verification",
    });
  }
};

const checkRolesExisted = (req, res, next) => {
  // First check if 'role' was used instead of 'roles'
  if (req.body.role) {
    return res.status(400).send({
      message:
        "Please use 'roles' (plural) instead of 'role' (singular) in the request body",
      example: {
        username: "example",
        email: "example@example.com",
        password: "password123",
        roles: ["manager", "officer"],
      },
    });
  }

  // If roles are provided, validate them
  if (req.body.roles) {
    // Ensure roles is an array
    if (!Array.isArray(req.body.roles)) {
      return res.status(400).send({
        message: "Roles must be provided as an array",
        example: {
          roles: ["manager", "officer"],
        },
      });
    }

    // Check for invalid roles
    const invalidRoles = req.body.roles.filter((role) => !ROLES.includes(role));

    if (invalidRoles.length > 0) {
      return res.status(400).send({
        message: "Invalid role(s) provided",
        validRoles: ROLES,
        invalidRoles: invalidRoles,
        example: {
          username: "example",
          email: "example@example.com",
          password: "password123",
          roles: ["manager", "officer"],
        },
      });
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
};

module.exports = verifySignUp;
