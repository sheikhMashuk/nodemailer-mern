const mongoose = require("mongoose");

// One document in the "users" collection = one account.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, never the real password

    // Filled in only while a "forgot password" link is waiting to be used
    resetToken: { type: String }, // SHA-256 hash of the token that was emailed
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
