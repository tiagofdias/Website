import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Contact,
  Blog,
  Hero,
  Navbar,
  Works,
  Footer,
} from "./components";
import { AboutSection, MyJourney } from "./components/About";
import Certifications from "./components/Certifications";
import ChatWidget from "./components/ChatWidget";

const CVViewer = React.lazy(() => import("./components/CVViewer"));
const AdminLogin = React.lazy(() => import("./components/Login"));
const AdminPanel = React.lazy(() => import("./components/AdminPanel"));

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("token");
  };

  return (
    <BrowserRouter>
      {/* Subtle ambient spotlight follower */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 hidden md:block"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 198, 254, 0.04), transparent 80%)`,
        }}
      />

      <Routes>
        <Route
          path="/"
          element={
            <div className="relative z-0 bg-primary">
              <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
                <Navbar />
                <Hero />
              </div>
              <Works />
              <Certifications />
              <AboutSection />
              <MyJourney />
              <Blog />
              <Contact /> 
              <Footer />
              <ChatWidget />
            </div>
          }
        />
        <Route
          path="/cv"
          element={
            <React.Suspense
              fallback={
                <div className="min-h-screen bg-primary flex items-center justify-center text-white font-medium">
                  <div className="w-8 h-8 border-2 border-[#00C6FE] border-t-transparent rounded-full animate-spin"></div>
                </div>
              }
            >
              <CVViewer />
            </React.Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <React.Suspense
              fallback={
                <div className="min-h-screen bg-primary flex items-center justify-center text-white font-medium">
                  <div className="w-8 h-8 border-2 border-[#00C6FE] border-t-transparent rounded-full animate-spin"></div>
                </div>
              }
            >
              {token ? (
                <AdminPanel token={token} onLogout={handleLogout} />
              ) : (
                <AdminLogin onLogin={handleLogin} />
              )}
            </React.Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;