module.exports = function (app) {
  const { authJwt } = require("../middlewares");
  const controller = require("../controllers/user.controller");

  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Routes pour la gestion des utilisateurs (officiers et managers)
  app.get(
    "/api/users",
    [authJwt.verifyToken, authJwt.isOfficerOrManager],
    controller.getUsers
  );

  app.get(
    "/api/users/:id",
    [authJwt.verifyToken, authJwt.isOfficerOrManager],
    controller.getUserById
  );

  app.put(
    "/api/users/:id/status",
    [authJwt.verifyToken, authJwt.isManager],
    controller.updateUserStatus
  );
};
