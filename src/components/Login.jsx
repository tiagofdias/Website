import { useState } from "react";
import { Button, Icon } from "./admin/AdminUI";
import "../admin.css";
import { startAuthentication } from "@simplewebauthn/browser";

const AdminLogin = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      onLogin(data.token);
    } catch {
      setError("Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Get authentication options
      const optResp = await fetch(
        `${API_URL}/webauthn/generate-authentication-options`,
      );
      const options = await optResp.json();
      if (options.error) throw new Error(options.error);

      // 2. Perform authentication using the user's authenticator (Yubikey/TouchID)
      const authResp = await startAuthentication(options);

      // 3. Verify the authentication response
      const verificationResp = await fetch(
        `${API_URL}/webauthn/verify-authentication`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authResp),
        },
      );

      const verificationJSON = await verificationResp.json();
      if (verificationJSON && verificationJSON.verified) {
        onLogin(verificationJSON.token);
      } else {
        throw new Error(verificationJSON.error || "Authentication failed");
      }
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Passkey sign-in was canceled. You can try again."
          : err.message || "Passkey sign-in failed. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <main className="cms-login">
      <div className="cms-login-layout">
        <div className="cms-login-story">
          <a className="cms-brand" href="/">
            <span className="cms-brand-symbol" aria-hidden="true">
              &#10035;
            </span>
            <span>
              TIAGO DIAS<small>Portfolio workspace</small>
            </span>
          </a>
          <span className="cms-overline">BEHIND THE PORTFOLIO</span>
          <h1>
            Your work.
            <br />
            <span>Your control.</span>
          </h1>
          <p>
            A focused space to manage your projects, credentials, profile, and
            the conversations around them.
          </p>
          <a href="/">
            Back to portfolio <Icon name="external" size={17} />
          </a>
        </div>
        <section className="cms-login-card" aria-labelledby="cms-login-title">
          <div className="cms-login-header-icon">
            <Icon name="key" />
          </div>
          <span className="cms-overline">WORKSPACE ACCESS</span>
          <h2 id="cms-login-title">Welcome back.</h2>
          <p>Sign in to manage your portfolio.</p>
          {error && (
            <div className="cms-inline-error" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="cms-field">
              <label htmlFor="cms-username">Username</label>
              <input
                id="cms-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
            <div className="cms-field">
              <label htmlFor="cms-password">Password</label>
              <div className="cms-password-input">
                <input
                  id="cms-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="cms-icon-button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name="eye" size={18} />
                </button>
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Signing in?" : "Sign in"}
            </Button>
          </form>
          <div className="cms-login-divider">or use your device</div>
          <Button icon="key" disabled={loading} onClick={handlePasskeyLogin}>
            Sign in with a passkey
          </Button>
          <p className="cms-login-note">
            Access is restricted to the portfolio owner.
          </p>
        </section>
      </div>
    </main>
  );
};
export default AdminLogin;
