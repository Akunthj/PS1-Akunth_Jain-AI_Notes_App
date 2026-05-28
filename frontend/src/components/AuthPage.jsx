// ============================================================
// AuthPage.jsx — Login and Register forms
// This page is shown when the user is NOT logged in.
// Once they log in or register, App.jsx switches to the notes UI.
// ============================================================

import { useState } from "react";
import { API_BASE } from "../App";

// onLogin is called with the user object when auth succeeds
function AuthPage({ onLogin }) {
  // Toggle between "login" and "register" mode
  const [mode, setMode] = useState("login");   // "login" or "register"

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [error, setError] = useState("");       // Error message to show user
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    if (!email || !password || (mode === "register" && !name)) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Pick the right endpoint based on mode
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

      const body = mode === "login"
        ? { email, password }
        : { name, email, password };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returned an error (e.g. wrong password, email taken)
        setError(data.detail || "Something went wrong.");
        return;
      }

      // SUCCESS — store the token in localStorage so it persists across page refreshes
      // localStorage is like a small key-value store in the browser
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name);

      // Tell App.jsx we're logged in
      onLogin({ token: data.token, name: data.name, email: data.email });

    } catch (err) {
      setError("Cannot connect to backend. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  // Allow pressing Enter to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* LOGO */}
        <div className="auth-logo">✦ Notes</div>
        <p className="auth-tagline">Your AI-powered notebook</p>

        {/* TAB SWITCHER */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Register
          </button>
        </div>

        {/* FORM */}
        <div className="auth-form">
          {/* Name field — only shown for register */}
          {mode === "register" && (
            <input
              className="auth-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* ERROR MESSAGE */}
          {error && <p className="auth-error">{error}</p>}

          {/* SUBMIT BUTTON */}
          <button
            className="auth-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </div>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            className="auth-switch-link"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
