import { useState } from "react";
import "./App.css";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ContactForm from "./pages/ContactForm.jsx";

// localStorage can hold only strings, so the user object is saved as JSON
const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// If we were opened from the email link, the URL looks like /?resetToken=abc123
const resetToken = new URLSearchParams(window.location.search).get("resetToken");

// No router library: `page` just says which screen to show.
function App() {
  const [user, setUser] = useState(loadUser);
  const [page, setPage] = useState(resetToken ? "reset" : "login");

  // Switch page and remove ?resetToken=... from the address bar
  const goTo = (name) => {
    window.history.replaceState(null, "", "/");
    setPage(name);
  };

  // Keep the login after a page refresh
  const handleLogin = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    goTo("login");
  };

  // A reset link always shows the reset page, even if someone is logged in
  if (page === "reset") return <ResetPassword token={resetToken} goTo={goTo} />;

  if (user) {
    return (
      <>
        <div className="topbar">
          <span>Hi, {user.name}</span>
          <button className="link" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <ContactForm />
      </>
    );
  }

  if (page === "register") return <Register onLogin={handleLogin} goTo={goTo} />;
  if (page === "forgot") return <ForgotPassword goTo={goTo} />;
  return <Login onLogin={handleLogin} goTo={goTo} />;
}

export default App;
