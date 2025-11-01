import React, { useState } from "react";
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
import { SnowOverlay } from "react-snow-overlay";
import AdminLogin from "./components/Login";
import AdminPanel from "./components/AdminPanel";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

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
      {/* <SnowOverlay maxParticles={25} disabledOnSingleCpuDevices={true} /> */}
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
          path="/admin"
          element={
            token ? (
              <>
                <AdminPanel token={token} onLogout={handleLogout} />
              </>
            ) : (
              <AdminLogin onLogin={handleLogin} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;