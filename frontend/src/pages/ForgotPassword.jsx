import { useState } from "react";
import { authRequest } from "../api";

// Asks for an email; the server emails a reset link to it (with Nodemailer).
function ForgotPassword({ goTo }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // { type: "success" | "error", text }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const data = await authRequest("forgot-password", { email });
      setStatus({ type: "success", text: data.message });
      setEmail("");
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Forgot password</h1>
      <p className="hint">Enter your email and we will send you a link to reset your password.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      {status && <p className={`status ${status.type}`}>{status.text}</p>}

      <div className="links">
        <button className="link" onClick={() => goTo("login")}>
          Back to login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
