const nodemailer = require("nodemailer");

// The "transporter" is the object that logs in to Gmail and sends emails.
// It lives in its own file so both server.js and routes/auth.js can use it.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password, not your normal password
  },
});

module.exports = transporter;
