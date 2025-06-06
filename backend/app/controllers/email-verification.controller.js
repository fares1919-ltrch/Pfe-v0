const crypto = require("crypto");
const nodemailer = require("nodemailer");
const config = require("../config/email.config");
const db = require("../models");
const User = db.user;

// Create transporter for sending emails
const transporter = nodemailer.createTransport(config);

/**
 * Send verification email to user
 * @param {Object} user - User object
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendVerificationEmail = async (user) => {
  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Hash token before saving to database
  user.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Set token expiration (48 hours)
  user.verificationTokenExpires = Date.now() + 48 * 3600000;

  // Save user with verification token
  await user.save();

  // Create verification URL
  const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";
  const verificationUrl = `${clientUrl}/auth/verify-email?token=${verificationToken}`;

  // Email content
  const mailOptions = {
    from: config.auth.user,
    to: user.email,
    subject: "Email Verification - Identity-Secure",
    html: `
      <h1>Verify Your Email Address</h1>
      <p>Thank you for registering with Identity-Secure. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px;">Verify My Account</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 48 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
  };

  // Send email
  return transporter.sendMail(mailOptions);
};

/**
 * Resend verification email
 */
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required!" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check if email is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified!" });
    }

    // Send verification email
    await sendVerificationEmail(user);

    res.status(200).json({ message: "Verification email sent!" });
  } catch (err) {
    console.error("Resend verification email error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Verify email with token
 */
exports.verifyEmail = async (req, res) => {
  try {
    // Get token from request params or body
    const token = req.query.token || req.body.token;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required!" });
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token!" });
    }

    // Mark email as verified and clear verification token
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Export the sendVerificationEmail function to be used in auth.controller.js
exports.sendVerificationEmail = sendVerificationEmail;
