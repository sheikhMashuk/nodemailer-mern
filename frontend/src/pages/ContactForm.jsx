import { useState } from "react";
import { API_URL } from "../api";

// Address of the contact route on our Express server
const SEND_EMAIL_URL = `${API_URL}/api/send-email`;

function ContactForm() {
  // What the user typed in the form
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  // The image the user picked (a File object), or null
  const [image, setImage] = useState(null);
  // Cloudinary link sent back by the server after a successful upload
  const [imageUrl, setImageUrl] = useState("");
  // Result message shown under the button: { type: "success" | "error", text: "..." }
  const [status, setStatus] = useState(null);
  // true while we wait for the server, so the button can be disabled
  const [loading, setLoading] = useState(false);

  // Runs on every keystroke. e.target.name is "name", "email" or "message",
  // so one function can update all three inputs.
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setLoading(true);
    setStatus(null);
    setImageUrl("");

    try {
      // JSON cannot carry files, so we use FormData (multipart/form-data) instead.
      // Don't set Content-Type yourself - the browser adds it for FormData.
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("message", form.message);
      if (image) formData.append("image", image); // "image" must match upload.single("image")

      const res = await fetch(SEND_EMAIL_URL, { method: "POST", body: formData });
      const data = await res.json();

      // fetch does not throw on 400/500, so we check res.ok ourselves
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setStatus({ type: "success", text: data.message });
      setImageUrl(data.imageUrl || "");
      setForm({ name: "", email: "", message: "" }); // clear the form
      setImage(null);
      e.target.reset(); // also clears the file input
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Contact Us</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <textarea
          name="message"
          placeholder="Your message"
          rows="5"
          value={form.message}
          onChange={handleChange}
          required
        />
        {/* Optional image - it gets uploaded to Cloudinary */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0] || null)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>

      {status && <p className={`status ${status.type}`}>{status.text}</p>}

      {/* Show the uploaded image straight from Cloudinary */}
      {imageUrl && (
        <div className="preview">
          <img src={imageUrl} alt="Uploaded" />
          <a href={imageUrl} target="_blank" rel="noreferrer">
            Open on Cloudinary
          </a>
        </div>
      )}
    </div>
  );
}

export default ContactForm;
