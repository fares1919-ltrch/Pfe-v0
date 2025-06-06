const db = require("../models");
const User = db.user;
const bcrypt = require("bcryptjs");

/************************************************
 * ROLE-BASED ACCESS CONTROL
 * Content access methods for different roles
 ************************************************/
exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.managerBoard = (req, res) => {
  res.status(200).send("Manager Content.");
};

exports.officerBoard = (req, res) => {
  res.status(200).send("Officer Content.");
};

/************************************************
 * USER MANAGEMENT (ADMIN FUNCTIONS)
 * Methods for getting and managing all users
 ************************************************/
// Helper to get users by role(s)
const getUsersByRoles = async (roles, query, skip, limit) => {
  // Find role IDs for the given role names
  const Role = require("../models/role.model");
  const roleDocs = await Role.find({ name: { $in: roles } });
  const roleIds = roleDocs.map((r) => r._id);
  query.roles = { $in: roleIds };
  const users = await User.find(query)
    .select("-password")
    .skip(skip)
    .limit(limit);
  const total = await User.countDocuments(query);
  return { users, total };
};

// For admin: get all managers and officers
exports.getAllWorkers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.username) {
      query.username = { $regex: req.query.username, $options: "i" };
    }
    if (req.query.email) {
      query.email = { $regex: req.query.email, $options: "i" };
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ];
    }
    // Handle role filter
    let roles = ["manager", "officer"];
    if (
      req.query.role &&
      (req.query.role === "manager" || req.query.role === "officer")
    ) {
      roles = [req.query.role];
    }
    const { users, total } = await getUsersByRoles(roles, query, skip, limit);
    const totalPages = Math.ceil(total / limit);
    res.json({ users, currentPage: page, totalPages, totalUsers: total });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// For officers/managers: get all citizens
exports.getAllCitizens = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};
    if (req.query.username) {
      query.username = { $regex: req.query.username, $options: "i" };
    }
    if (req.query.email) {
      query.email = { $regex: req.query.email, $options: "i" };
    }
    if (req.query.id) {
      query._id = req.query.id;
    }
    if (req.query.firstName) {
      query.firstName = { $regex: req.query.firstName, $options: "i" };
    }
    if (req.query.lastName) {
      query.lastName = { $regex: req.query.lastName, $options: "i" };
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
      ];
    }
    const { users, total } = await getUsersByRoles(
      ["user"],
      query,
      skip,
      limit
    );
    const totalPages = Math.ceil(total / limit);
    res.json({ users, currentPage: page, totalPages, totalUsers: total });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    let { status, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const allowedStatuses = ["pending", "active", "blocked"];
    // If status is provided, synchronize isActive accordingly
    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).send({ message: "Invalid status value" });
      }
      // Prevent setting status to 'pending' if user is already active or blocked
      if (
        status === "pending" &&
        (user.status === "active" || user.status === "blocked")
      ) {
        return res
          .status(400)
          .send({
            message: "Cannot set status back to 'pending' after activation.",
          });
      }
      user.status = status;
      if (status === "active") {
        user.isActive = true;
      } else if (status === "blocked" || status === "pending") {
        user.isActive = false;
      }
    } else if (typeof isActive === "boolean") {
      // If isActive is provided and status is not, synchronize status accordingly
      user.isActive = isActive;
      if (isActive) {
        user.status = "active";
      } else {
        user.status = "blocked";
      }
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select("-password");
    res.send({
      message: "User status updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { roles } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    user.roles = roles;
    await user.save();

    res.send({ message: "User roles updated successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * USER PROFILE MANAGEMENT
 * Methods for users to manage their own profile
 ************************************************/
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.userId },
      });

      if (emailExists) {
        return res.status(400).send({
          message: "Email is already in use",
        });
      }
      user.email = email;
    }

    if (currentPassword && newPassword) {
      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return res.status(400).send({
          message: "Current password is incorrect",
        });
      }

      user.password = await bcrypt.hash(newPassword, 8);
    }

    await user.save();
    res.send({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * VERIFICATION UTILITIES
 * Helper methods for verification processes
 ************************************************/
exports.checkIdentityNumber = async (req, res) => {
  try {
    const user = await User.findOne({
      identityNumber: req.params.identityNumber,
    });
    res.json({ isAvailable: !user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user by ID (admin action)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.send({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
