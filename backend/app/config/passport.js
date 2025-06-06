const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const GitHubStrategy = require("passport-github2").Strategy; // Commented out GitHub strategy
const jwt = require("jsonwebtoken");
const { google, github, jwtSecret } = require("./auth.config");
const User = require("../models/user.model");
const Role = require("../models/role.model");

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: google.clientID,
      clientSecret: google.clientSecret,
      callbackURL: google.callbackURL,
      authProviderX509CertUrl: google.authProviderX509CertUrl,
      authUri: google.authUri,
      tokenUri: google.tokenUri,
      passReqToCallback: true,
      scope: ["profile", "email"],
      prompt: "select_account", // Always show account selection screen
      accessType: "offline", // Request refresh token
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails?.[0]?.value) {
          throw new Error("No email found in Google profile");
        }

        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          const userRole = await Role.findOne({ name: "user" });
          if (!userRole) {
            throw new Error("Default user role not found");
          }

          // Create a new user with Google OAuth
          user = new User({
            username: profile.displayName || email.split("@")[0],
            email,
            provider: "google", // This is important to skip password validation
            googleId: profile.id,
            roles: [userRole._id],
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            photo: profile.photos?.[0]?.value,
            // No password needed for OAuth users
          });
          await user.save();
        } else {
          // Update existing user with Google info
          if (!user.googleId) {
            user.googleId = profile.id;

            // If this was a local account, keep the provider as is
            // but add the Google ID for future logins
            if (user.provider === "local") {
              console.log("Linked Google account to existing local account");
            } else {
              user.provider = "google";
              console.log("Updated existing user with Google provider");
            }

            // Update profile info if missing
            if (!user.firstName && profile.name?.givenName) {
              user.firstName = profile.name.givenName;
            }
            if (!user.lastName && profile.name?.familyName) {
              user.lastName = profile.name.familyName;
            }
            if (!user.photo && profile.photos?.[0]?.value) {
              user.photo = profile.photos[0].value;
            }

            await user.save();
          }
        }

        // Set user in the request
        req.user = user;

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error);
      }
    }
  )
);

/* Commenting out GitHub authentication as requested
// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: github.clientID,
      clientSecret: github.clientSecret,
      callbackURL: github.callbackURL,
      authorizationURL: github.authorizationURL,
      tokenURL: github.tokenURL,
      passReqToCallback: true,
      scope: github.scope,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("GitHub Profile:", profile); // Debug log

        if (!profile.emails?.[0]?.value) {
          throw new Error("No email found in GitHub profile");
        }

        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          const userRole = await Role.findOne({ name: "user" });
          if (!userRole) {
            throw new Error("Default user role not found");
          }

          user = new User({
            username: profile.username || email.split("@")[0],
            email,
            provider: "github",
            githubId: profile.id,
            roles: [userRole._id],
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            photo: profile.photos?.[0]?.value,
          });
          await user.save();
        } else {
          // Ensure provider is set to github even for existing users
          if (user.provider !== "github") {
            user.provider = "github";
            user.githubId = profile.id;
            await user.save();
            console.log("Updated existing user with GitHub provider");
          }
        }

        // Set user in the request
        req.user = user;

        return done(null, user);
      } catch (error) {
        console.error("GitHub OAuth error:", error);
        return done(error);
      }
    }
  )
);
*/

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate("roles");
    done(null, user);
  } catch (error) {
    done(error);
  }
});
