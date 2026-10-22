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

const AdminLogin = React.lazy(() => import("./components/Login"));
const AdminPanel = React.lazy(() => import("./components/AdminPanel"));

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