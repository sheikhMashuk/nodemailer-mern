const mongoose = require("mongoose");

// A schema describes what one document in the "messages" collection looks like.
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    imageUrl: { type: String }, // Cloudinary link, only if the visitor attached an image
  },
  { timestamps: true } // Mongoose adds createdAt and updatedAt for us
);

module.exports = mongoose.model("Message", messageSchema);
