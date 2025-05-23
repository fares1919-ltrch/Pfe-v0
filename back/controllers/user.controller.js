const User = require("../models/user.model");

// Récupérer tous les utilisateurs avec filtres
exports.getUsers = async (req, res) => {
  try {
    const {
      status,
      cpfStatus,
      deduplicationStatus,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Construire la requête avec les filtres
    let query = {};

    if (status) {
      query.status = status;
    }

    if (cpfStatus) {
      query["cpf.status"] = cpfStatus;
    }

    if (deduplicationStatus) {
      query.deduplicationStatus = deduplicationStatus;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "cpf.number": { $regex: search, $options: "i" } },
      ];
    }

    // Calculer le nombre total pour la pagination
    const total = await User.countDocuments(query);

    // Récupérer les utilisateurs avec pagination
    const users = await User.find(query)
      .select("-password -resetPasswordToken -emailVerificationToken")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer un utilisateur spécifique
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -resetPasswordToken -emailVerificationToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mettre à jour le statut d'un utilisateur
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "suspended", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).select("-password -resetPasswordToken -emailVerificationToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User status updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
