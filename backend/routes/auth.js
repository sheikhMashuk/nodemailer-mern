const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const transporter = require("../config/mailer");

const router = express.Router();

// Create a login token (JWT) that the React app keeps and sends back later
const createToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

// Only send safe fields to the browser (never the password hash)
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

// The reset token is stored hashed, so a leaked database can't be used to reset passwords
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// ---------- POST /api/auth/register ----------
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    // bcrypt turns the password into a one-way hash (10 = how hard it is to crack)
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create the account" });
  }
});

// ---------- POST /api/auth/login ----------
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Please enter email and password" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    // Same message for "no user" and "wrong password", so nobody can guess which emails exist
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Wrong email or password" });
    }

    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not log in" });
  }
});

// ---------- POST /api/auth/forgot-password ----------
// Emails a link like http://localhost:5173/?resetToken=abc123 (valid for 15 minutes)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body ?? {};
  const reply = { message: "If that email has an account, a reset link has been sent." };

  if (!email) {
    return res.status(400).json({ error: "Please enter your email" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    // Answer the same way whether or not the user exists
    if (!user) return res.json(reply);

    // 1. Make a random token; save only its hash + an expiry time
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = hashToken(token);
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // 2. Email the real token inside a link to the React app
    const link = `${process.env.CLIENT_URL}/?resetToken=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset your password",
      text: `Hi ${user.name},\n\nClick this link to choose a new password (valid for 15 minutes):\n${link}\n\nIf you did not ask for this, just ignore this email.`,
      html: `<p>Hi ${user.name},</p>
             <p>Click the link below to choose a new password (valid for 15 minutes):</p>
             <p><a href="${link}">Reset my password</a></p>
             <p>If you did not ask for this, just ignore this email.</p>`,
    });

    res.json(reply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not send the reset email. Try again later." });
  }
});

// ---------- POST /api/auth/reset-password/:token ----------
router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body ?? {};

  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    // Find the user whose token matches AND has not expired yet
    const user = await User.findOne({
      resetToken: hashToken(req.params.token),
      resetTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: "Reset link is invalid or has expired" });
    }

    // Save the new password and delete the token so the link works only once
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: "Password changed. You can log in now." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reset the password" });
  }
});

module.exports = router;
