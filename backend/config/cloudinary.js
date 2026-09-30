const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// ---------- Cloudinary setup ----------
// Log in to Cloudinary with the keys from the .env file.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------- Multer setup ----------
// Multer reads the file from the form. memoryStorage keeps it in RAM (req.file.buffer)
// instead of saving it to disk, because we send it straight to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // max 4 MB (Vercel rejects requests over 4.5 MB)
  fileFilter: (req, file, cb) => {
    // only accept images
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// Upload a file from memory to Cloudinary and return the result
// (result.secure_url is the public https link to the image).
const uploadToCloudinary = (file) => {
  // Turn the raw bytes into a "data URI" string that Cloudinary understands
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, { folder: "contact-form" });
};

module.exports = { upload, uploadToCloudinary };
