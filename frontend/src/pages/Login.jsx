import { useState } from "react";
import { authRequest } from "../api";

// onLogin(token, user) is called after a successful login.
// goTo("register" | "forgot") switches to another page.
function Login({ onLogin, goTo }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await authRequest("login", form);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {error && <p className="status error">{error}</p>}

      <div className="links">
        <button className="link" onClick={() => goTo("forgot")}>
          Forgot password?
        </button>
        <button className="link" onClick={() => goTo("register")}>
          Create an account
        </button>
      </div>
    </div>
  );
}

export default Login;
