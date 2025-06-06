const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const RefreshToken = db.refreshToken;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/************************************************
 * USER REGISTRATION
 * Creates a new user account with appropriate roles
 ************************************************/
exports.signup = async (req, res) => {
  try {
    // Save User to Database
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      provider: "local",
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country,
      postalCode: req.body.postalCode,
      aboutMe: req.body.aboutMe,
      work: req.body.work,
      workplace: req.body.workplace,
      photo: req.body.photo,
      identityNumber: req.body.identityNumber,
      birthDate: req.body.birthDate,
    });

    // Handle role assignment
    let assignedRoles = [];
    if (req.body.roles && req.body.roles.length > 0) {
      // Find roles specified in the request
      const roles = await Role.find({
        name: { $in: req.body.roles },
      });
      if (roles.length !== req.body.roles.length) {
        return res.status(400).json({
          message: "One or more roles specified do not exist!",
          validRoles: ["user", "manager", "officer"],
          providedRoles: req.body.roles,
        });
      }
      assignedRoles = roles.map((role) => role.name);
      user.roles = roles.map((role) => role._id);
    } else {
      // Assign default 'user' role if no roles specified
      const defaultRole = await Role.findOne({ name: "user" });
      if (!defaultRole) {
        return res.status(500).json({
          message: "Default role 'user' not found in the database!",
        });
      }
      assignedRoles = ["user"];
      user.roles = [defaultRole._id];
    }

    // Set isActive and status based on role
    if (
      assignedRoles.includes("manager") ||
      assignedRoles.includes("officer")
    ) {
      user.isActive = false;
      user.status = "pending";
    } else {
      // Citizen (user)
      user.isActive = true;
      user.status = "active";
    }

    // For development: always set isVerified to true (skip email verification)
    user.isVerified = true;

    // Save the user with roles
    const savedUser = await user.save();
    await savedUser.populate("roles", "-__v");

    res.status(200).json({
      message: "User was registered successfully!",
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        roles: savedUser.roles.map((role) => role.name),
        isActive: savedUser.isActive,
        status: savedUser.status,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "An error occurred during signup" });
  }
};

/************************************************
 * USER AUTHENTICATION
 * Handles login and generates JWT tokens
 ************************************************/
exports.signin = async (req, res) => {
  try {
    // Find user and populate roles
    const user = await User.findOne({ username: req.body.username }).populate(
      "roles",
      "-__v"
    );

    if (!user) {
      return res.status(404).json({ message: "User Not found." });
    }

    // Validate password
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    // Determine user role
    const userRoles = user.roles.map((role) => role.name);
    const isWorker =
      userRoles.includes("manager") || userRoles.includes("officer");
    const isCitizen = userRoles.includes("user");

    // Worker (officer/manager) must be active and status active
    if (isWorker && (!user.isActive || user.status !== "active")) {
      return res.status(403).json({
        accessToken: null,
        message:
          "Account not activated. Please wait for the administrator to activate your account.",
      });
    }
    // Citizens can always log in
    // (If you want to restrict citizens, add logic here)

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
      algorithm: "HS256",
      allowInsecureKeySizes: true,
      expiresIn: "24h", // Match cookie duration
    });

    // Generate refresh token with longer expiration
    let refreshToken = await RefreshToken.createToken(user);

    // Generate authorities from roles
    const authorities = user.roles.map(
      (role) => `ROLE_${role.name.toUpperCase()}`
    );

    // Add session to user's active sessions
    const session = {
      token: token,
      device: req.headers["user-agent"] || "Unknown",
      lastActive: new Date(),
      ipAddress: req.ip,
    };

    user.activeSessions.push(session);
    await user.save();

    // Set session data with enhanced security
    req.session.token = token;
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.roles = authorities;
    req.session.lastActive = new Date();

    // Set secure cookie with token
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.DOMAIN
          : "localhost",
    });

    // Set secure cookie with refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken: token,
      refreshToken: refreshToken,
      provider: user.provider || "local",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "An error occurred during signin" });
  }
};

/************************************************
 * USER LOGOUT
 * Ends the user session and invalidates tokens
 ************************************************/
exports.signout = async (req, res) => {
  try {
    console.log("Backend: Processing signout request");

    // Get token from various places
    const token =
      req.headers["x-access-token"] || req.session?.token || req.cookies?.token;

    // Get refresh token from various places
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    console.log("Backend: Attempting to sign out with token:", !!token);

    if (token) {
      try {
        // Attempt to decode the user ID from the token
        const decoded = jwt.verify(token, config.jwtSecret);

        if (decoded && decoded.id) {
          // Get the user and check their auth provider
          const user = await User.findById(decoded.id);

          if (user) {
            console.log(
              "Backend: Found user for logout, provider:",
              user.provider,
              "Expected provider stored on user object:"
            );

            // Log all user fields to diagnose the issue
            console.log("Backend: User data:", {
              email: user.email,
              username: user.username,
              googleId: user.googleId,
              githubId: user.githubId,
              provider: user.provider,
            });

            // Update the provider field if the user has a googleId or githubId but provider is not set correctly
            if (user.googleId && user.provider !== "google") {
              user.provider = "google";
              console.log("Backend: Fixed provider to google");
            } else if (user.githubId && user.provider !== "github") {
              user.provider = "github";
              console.log("Backend: Fixed provider to github");
            }

            // Remove this session from user's active sessions
            user.activeSessions = user.activeSessions.filter(
              (session) => session.token !== token
            );
            await user.save();

            // Remove refresh tokens for this user from the database
            await RefreshToken.deleteMany({ user: user._id });
            console.log("Backend: Deleted all refresh tokens for user");

            // Extra cleanup for OAuth providers
            if (user.provider === "google" || user.provider === "github") {
              console.log(
                `Backend: Special cleanup for ${user.provider} provider`
              );
              // Additional cleanup for OAuth sessions if needed
            }
          }
        }
      } catch (tokenError) {
        // Token might be expired or invalid, but we proceed with logout anyway
        console.log(
          "Backend: Token validation error during signout:",
          tokenError.message
        );
      }
    }

    // If we have a refresh token but no access token, try to find and delete it
    if (refreshToken && !token) {
      try {
        const foundToken = await RefreshToken.findOne({ token: refreshToken });
        if (foundToken) {
          console.log("Backend: Found refresh token to delete");
          await RefreshToken.deleteOne({ token: refreshToken });
        }
      } catch (refreshError) {
        console.log(
          "Backend: Error deleting refresh token:",
          refreshError.message
        );
      }
    }

    // Clear the session regardless of token
    if (req.session) {
      try {
        if (typeof req.session.destroy === "function") {
          // Express-session style
          req.session.destroy();
        } else {
          // Cookie-session style
          req.session = null;
        }
      } catch (sessionError) {
        console.error("Backend: Error clearing session:", sessionError);
        // Fallback
        req.session = null;
      }
    }

    // Clear cookies with varied domain settings to ensure they're removed
    // First try with exact domain matching
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.DOMAIN
          : "localhost",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.DOMAIN
          : "localhost",
      path: "/",
    });

    // Then try without domain specification for broader removal
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Also clear session cookies
    res.clearCookie("connect.sid", { path: "/" });
    res.clearCookie("sessionId", { path: "/" });

    // Add cache-busting headers to ensure browsers don't cache the response
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    console.log("Backend: User signed out successfully");
    return res.status(200).json({
      message: "You've been signed out successfully.",
      success: true,
    });
  } catch (err) {
    console.error("Backend: Error during signout:", err);
    res.status(500).json({
      message: err.message || "An error occurred during signout",
      success: false,
    });
  }
};

/************************************************
 * OAUTH AUTHENTICATION
 * Handles OAuth callbacks (Google, GitHub)
 ************************************************/

/**
 * Shared OAuth callback handler to reduce code duplication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {String} provider - OAuth provider name (google/github)
 * @param {Error} err - Error object if any
 */
const handleOAuthCallback = async (req, res, provider, err) => {
  try {
    if (err) {
      console.error(`${provider} OAuth error:`, err);
      const loginErrorUrl =
        process.env.NODE_ENV === "production"
          ? `${process.env.FRONTEND_URL}/auth/login?error=oauth_error&provider=${provider}`
          : `http://localhost:4200/auth/login?error=oauth_error&provider=${provider}`;
      return res.redirect(loginErrorUrl);
    }

    // The user object is already populated by passport
    const user = req.user;
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: "24h", // Match cookie duration
      algorithm: "HS256",
    });

    // Ensure user has the correct roles and populate them
    if (!user.roles || user.roles.length === 0) {
      const userRole = await Role.findOne({ name: "user" });
      if (!userRole) {
        throw new Error("Default user role not found");
      }
      user.roles = [userRole._id];
      await user.save();
    }

    // Populate roles for the user
    await user.populate("roles");

    // Set session data with populated roles
    req.session.token = token;
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.roles = user.roles.map(
      (role) => `ROLE_${role.name.toUpperCase()}`
    );
    req.session.lastActive = new Date();

    // Set secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.DOMAIN
          : "localhost",
    });

    // Generate refresh token with longer expiration
    let refreshToken = await RefreshToken.createToken(user);

    // Set secure cookie with refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to appropriate dashboard based on roles
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:4200";

    const roles = req.session.roles;
    if (roles.includes("ROLE_USER")) {
      return res.redirect(`${frontendUrl}/dashboard/citizen?token=${token}`);
    } else if (roles.includes("ROLE_MANAGER")) {
      return res.redirect(`${frontendUrl}/dashboard/manager?token=${token}`);
    } else if (roles.includes("ROLE_OFFICER")) {
      return res.redirect(`${frontendUrl}/dashboard/officer?token=${token}`);
    }

    // Default to citizen dashboard if role is not recognized
    return res.redirect(`${frontendUrl}/dashboard/citizen?token=${token}`);
  } catch (err) {
    console.error(`${provider} OAuth callback error:`, err);
    const loginErrorUrl =
      process.env.NODE_ENV === "production"
        ? `${process.env.FRONTEND_URL}/auth/login?error=oauth_error&provider=${provider}`
        : "http://localhost:4200/auth/login?error=oauth_error&provider=${provider}";

    return res.redirect(loginErrorUrl);
  }
};

// Google OAuth Callback
exports.googleCallback = async (req, res) => {
  try {
    console.log("Google OAuth callback started");

    if (!req.user) {
      console.error("Google OAuth error: No user data in request");
      return res.status(401).json({ message: "Authentication failed" });
    }

    console.log("Google OAuth user data:", {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.displayName,
      name: req.user.name,
    });

    // Check if user exists
    let user = await User.findOne({
      $or: [{ email: req.user.email }, { googleId: req.user.id }],
    }).populate("roles");

    // Flag to check if this is a new user
    let isNewUser = false;

    if (!user) {
      console.log("Google OAuth: Creating new user");
      // Create new user if doesn't exist
      isNewUser = true;
      const defaultRole = await Role.findOne({ name: "user" });
      if (!defaultRole) {
        console.error("Google OAuth error: Default role not found");
        return res.status(500).json({ message: "Default role not found" });
      }

      user = new User({
        username: req.user.email.split("@")[0],
        email: req.user.email,
        firstName: req.user.name?.givenName || req.user.displayName,
        lastName: req.user.name?.familyName || "",
        roles: [defaultRole._id],
        googleId: req.user.id,
        provider: "google",
      });
      await user.save();
      await user.populate("roles");
      console.log("Google OAuth: New user created with ID:", user._id);
    } else {
      console.log("Google OAuth: Existing user found with ID:", user._id);
    }

    // For new users, redirect to login page with a message
    if (isNewUser) {
      console.log("Google OAuth: Redirecting new user to login page");
      const frontendUrl =
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL
          : "http://localhost:4200";

      return res.redirect(
        `${frontendUrl}/auth/login?registration=success&provider=google`
      );
    }

    // For existing users, continue with the login process
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      algorithm: "HS256",
      expiresIn: "24h",
    });
    console.log("Google OAuth: Generated token for user");

    // Generate refresh token
    const refreshToken = await RefreshToken.createToken(user);

    // Set session data
    req.session.token = token;
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.roles = user.roles.map(
      (role) => `ROLE_${role.name.toUpperCase()}`
    );
    console.log("Google OAuth: Session data set");

    // Set cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log("Google OAuth: Cookies set");

    // Redirect to frontend OAuth callback with token
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:4200";

    const redirectUrl = `${frontendUrl}/auth/oauth-callback/google?token=${token}`;
    console.log("Google OAuth: Redirecting to:", redirectUrl);
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("Google OAuth Error:", err);

    // Instead of redirecting directly, send a JSON response with redirect URL
    const errorUrl =
      process.env.NODE_ENV === "production"
        ? `${process.env.FRONTEND_URL}/auth/login?error=oauth_error&provider=google`
        : "http://localhost:4200/auth/login?error=oauth_error&provider=google";

    return res.status(400).json({
      success: false,
      message: "Authentication failed",
      redirectUrl: errorUrl,
    });
  }
};

/* Commenting out GitHub authentication as requested
// GitHub OAuth Callback
exports.githubCallback = async (req, res) => {
  try {
    console.log("GitHub OAuth callback started");

    if (!req.user) {
      console.error("GitHub OAuth error: No user data in request");
      return res.status(401).json({ message: "Authentication failed" });
    }

    console.log("GitHub OAuth user data:", {
      id: req.user.id,
      email: req.user.emails?.[0]?.value,
      displayName: req.user.displayName,
      username: req.user.username,
    });

    // Check if user exists
    let user = await User.findOne({
      $or: [{ email: req.user.emails?.[0]?.value }, { githubId: req.user.id }],
    }).populate("roles");

    // Flag to check if this is a new user
    let isNewUser = false;

    if (!user) {
      console.log("GitHub OAuth: Creating new user");
      // Create new user if doesn't exist
      isNewUser = true;
      const defaultRole = await Role.findOne({ name: "user" });
      if (!defaultRole) {
        console.error("GitHub OAuth error: Default role not found");
        return res.status(500).json({ message: "Default role not found" });
      }

      user = new User({
        username:
          req.user.username || req.user.emails?.[0]?.value.split("@")[0],
        email: req.user.emails?.[0]?.value,
        firstName: req.user.displayName || "",
        roles: [defaultRole._id],
        githubId: req.user.id,
        provider: "github",
      });
      await user.save();
      await user.populate("roles");
      console.log("GitHub OAuth: New user created with ID:", user._id);
    } else {
      console.log("GitHub OAuth: Existing user found with ID:", user._id);
    }

    // For new users, redirect to login page with a message
    if (isNewUser) {
      console.log("GitHub OAuth: Redirecting new user to login page");
      const frontendUrl =
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL
          : "http://localhost:4200";

      return res.redirect(
        `${frontendUrl}/auth/login?registration=success&provider=github`
      );
    }

    // For existing users, continue with the login process
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      algorithm: "HS256",
      expiresIn: "24h",
    });
    console.log("GitHub OAuth: Generated token for user");

    // Generate refresh token
    const refreshToken = await RefreshToken.createToken(user);

    // Set session data
    req.session.token = token;
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.roles = user.roles.map(
      (role) => `ROLE_${role.name.toUpperCase()}`
    );
    console.log("GitHub OAuth: Session data set");

    // Set cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log("GitHub OAuth: Cookies set");

    // Redirect to frontend OAuth callback
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:4200";

    const redirectUrl = `${frontendUrl}/auth/oauth-callback/github?token=${token}`;
    console.log("GitHub OAuth: Redirecting to:", redirectUrl);
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("GitHub OAuth Error:", err);

    // Instead of redirecting directly, send a JSON response with redirect URL
    const errorUrl =
      process.env.NODE_ENV === "production"
        ? `${process.env.FRONTEND_URL}/auth/login?error=oauth_error&provider=github`
        : "http://localhost:4200/auth/login?error=oauth_error&provider=github";

    return res.status(400).json({
      success: false,
      message: "Authentication failed",
      redirectUrl: errorUrl,
    });
  }
};
*/

// Google logout handler
exports.googleLogout = async (req, res) => {
  try {
    console.log("Backend: Processing Google logout request");

    // Get token from various places
    const token =
      req.headers["x-access-token"] || req.session?.token || req.cookies?.token;

    // Get refresh token from various places
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (token) {
      try {
        // Attempt to decode the user ID from the token
        const decoded = jwt.verify(token, config.jwtSecret);

        if (decoded && decoded.id) {
          // Get the user and check if it's a Google user
          const user = await User.findById(decoded.id);

          if (user && user.provider === "google") {
            console.log("Backend: Found Google user for logout");

            // Remove this session from user's active sessions
            user.activeSessions = user.activeSessions.filter(
              (session) => session.token !== token
            );
            await user.save();

            // Remove refresh tokens for this user from the database
            await RefreshToken.deleteMany({ user: user._id });
            console.log("Backend: Deleted all refresh tokens for Google user");
          }
        }
      } catch (tokenError) {
        console.log(
          "Backend: Token validation error during Google logout:",
          tokenError.message
        );
      }
    }

    // Clear the session regardless of token
    if (req.session) {
      try {
        if (typeof req.session.destroy === "function") {
          req.session.destroy();
        } else {
          req.session = null;
        }
      } catch (sessionError) {
        console.error("Backend: Error clearing session:", sessionError);
        req.session = null;
      }
    }

    // Clear all cookies
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.clearCookie("connect.sid", { path: "/" });
    res.clearCookie("sessionId", { path: "/" });

    // Add cache-busting headers
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).json({
      message: "Google logout successful",
      success: true,
    });
  } catch (err) {
    console.error("Backend: Error during Google logout:", err);
    res.status(500).json({
      message: err.message || "An error occurred during Google logout",
      success: false,
    });
  }
};
