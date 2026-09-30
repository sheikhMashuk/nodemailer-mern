import { useState } from "react";
import { authRequest } from "../api";

// Opened from the link in the email (http://localhost:5173/?resetToken=...).
// `token` is the value taken from the URL by App.jsx.
function ResetPassword({ token, goTo }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (password !== confirm) {
      return setStatus({ type: "error", text: "Passwords do not match" });
    }

    setLoading(true);
    try {
      const data = await authRequest(`reset-password/${token}`, { password });
      setStatus({ type: "success", text: data.message });
      setPassword("");
      setConfirm("");
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>New password</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password (min 6 characters)"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Repeat new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Change password"}
        </button>
      </form>

      {status && <p className={`status ${status.type}`}>{status.text}</p>}

      <div className="links">
        <button className="link" onClick={() => goTo("login")}>
          Go to login
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;
