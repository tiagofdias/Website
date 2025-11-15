import React, { useState } from "react";
import { motion } from "framer-motion";

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

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
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          padding: "48px",
          width: "100%",
          maxWidth: "440px",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "20px",
              margin: "0 auto 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
            }}
          >
            🔐
          </motion.div>
          <h2
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Admin Panel
          </h2>
          <p
            style={{
              margin: "8px 0 0 0",
              color: "#64748b",
              fontSize: "15px",
            }}
          >
            Sign in to manage your portfolio
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#334155",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "15px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                outline: "none",
                transition: "all 0.3s ease",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#334155",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "15px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                outline: "none",
                transition: "all 0.3s ease",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "12px 16px",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "600",
              color: "#fff",
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: loading
                ? "none"
                : "0 4px 14px rgba(102, 126, 234, 0.4)",
              fontFamily: "inherit",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #fff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "32px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "13px",
          }}
        >
          Secure admin access only
        </div>
      </motion.div>

      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;