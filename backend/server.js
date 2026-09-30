// Load the values from the .env file into process.env
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const { upload, uploadToCloudinary } = require("./config/cloudinary");
const transporter = require("./config/mailer");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors()); // lets the React app (running on another port) call this server
app.use(express.json()); // lets us read the JSON body sent by React as req.body

// ---------- Nodemailer check ----------
// The transporter itself is in config/mailer.js.
// Check the Gmail login once when the server starts, so mistakes show up early.
transporter
  .verify()
  .then(() => console.log("Email login OK"))
  .catch((err) => console.error("Email login FAILED:", err.message));

// ---------- MongoDB ----------
// Connect once and reuse the connection. On Vercel there is no "start" step,
// so every request waits here until the connection is ready.
let dbConnection;
const connectDB = () => {
  if (!dbConnection) {
    dbConnection = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
      .then(() => console.log("MongoDB connected"))
      .catch((err) => {
        dbConnection = null; // try again on the next request
        throw err;
      });
  }
  return dbConnection;
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection FAILED:", err.message);
    res.status(500).json({ error: "Could not connect to the database" });
  }
});

// ---------- Health check ----------
// Open the backend URL in a browser to check that it's running
app.get("/", (req, res) => res.json({ status: "ok" }));

// ---------- Auth routes ----------
// register, login, forgot-password, reset-password (see routes/auth.js)
app.use("/api/auth", authRoutes);

// ---------- Contact route ----------
// upload.single("image") = multer reads ONE file from the form field named "image"
// and puts it in req.file. The text fields end up in req.body as usual.
app.post("/api/send-email", upload.single("image"), async (req, res) => {
  const { name, email, message } = req.body ?? {};

  // 1. Validate the data that came from the form
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email" });
  }

  try {
    // 2. If an image was attached, upload it to Cloudinary and keep its link
    let imageUrl;
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      imageUrl = result.secure_url;
      console.log("Image uploaded to Cloudinary:", imageUrl);
    }

    // 3. Save the message in MongoDB
    await Message.create({ name, email, message, imageUrl });

    // 4. Send the email (to yourself) with Nodemailer
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email, // pressing "Reply" in Gmail answers the visitor
      subject: `New message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    // 5. Tell React it worked
    res.json({ message: "Email sent successfully!", imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not send the email. Try again later." });
  }
});

// ---------- Error handler ----------
// Catches multer errors (file too big, not an image) and returns them as JSON.
app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

// ---------- Start ----------
// On your computer: start listening, and connect to MongoDB right away so problems show up early.
// On Vercel (which sets VERCEL=1): don't listen - Vercel runs the exported app itself.
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  connectDB().catch((err) => console.error("MongoDB connection FAILED:", err.message));
}

module.exports = app;
