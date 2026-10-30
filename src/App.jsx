import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Portfolio from "./components/Portfolio";
import "./portfolio.css";
const AdminLogin = lazy(() => import("./components/Login"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const login = (value) => {
    localStorage.setItem("token", value);
    setToken(value);
  };
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="site-loading">Loading Tiago’s portfolio…</div>
        }
      >
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/cv" element={<Portfolio resume />} />
          <Route
            path="/admin"
            element={
              <div className="admin-shell">
                {token ? (
                  <AdminPanel token={token} onLogout={logout} />
                ) : (
                  <AdminLogin onLogin={login} />
                )}
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="not-found">
                <span className="eyebrow">404 / OFF THE GRID</span>
                <h1>
                  Let’s get you
                  <br />
                  back on track.
                </h1>
                <a className="button primary" href="/">
                  Back to portfolio ↗
                </a>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
