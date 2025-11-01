import React, { useEffect, useState } from "react";
import { Link as ScrollLink } from "react-scroll";
import { styles } from "../styles";
import { navLinks } from "../constants";
import { menu, close } from "../assets";

const Navbar = () => {
  const [active, setActive] = useState("");
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      if (scrollTop > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (nav) => {
    setActive(nav.title);
  };

  return (
    <nav
      className={`w-full fixed top-0 z-20 ${
        scrolled ? "bg-primary" : "bg-transparent"
      }`}
    >
      <div className="w-full sm:max-w-7xl sm:mx-auto px-4 sm:px-16 py-5 flex justify-between items-center">
        {/* Logo */}
        <ScrollLink
          to="hero"
          smooth={true}
          duration={500}
          offset={-50}
          className="flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={() => setActive("")}
          href="hero"
        >
          <p className="text-white text-[18px] font-bold flex">
            Tiago &nbsp;
            <span> Dias</span>
          </p>
        </ScrollLink>

        {/* Desktop Navigation */}
        <ul className="list-none hidden sm:flex flex-row gap-10">
          {navLinks.map((nav) => (
            <li
              key={nav.id}
              className={`${
                active === nav.title ? "text-secondary" : "text-secondary"
              } hover:text-white text-[18px] font-medium cursor-pointer`}
              onClick={() => handleNavClick(nav)}
            >
              <ScrollLink
                to={nav.id}
                smooth={true}
                duration={500}
                offset={0}
                onClick={() => setActive(nav.title)}
                href={nav.id}
              >
                {nav.title}
              </ScrollLink>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <div className="sm:hidden">
          <button
            className="relative w-10 h-10 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:border-[#00C6FE]/50 flex items-center justify-center transition-all duration-300"
            onClick={() => setToggle(!toggle)}
          >
            <img
              src={toggle ? close : menu}
              alt="menu"
              className="w-5 h-5 object-contain"
            />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {toggle && (
          <>
            {/* Backdrop */}
            <div 
              className="sm:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-10 top-[72px]"
              onClick={() => setToggle(false)}
            />
            
            {/* Menu Panel */}
            <div className="sm:hidden fixed top-20 right-4 left-4 z-20 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 border-b border-white/10 px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="text-xl">🧭</span>
                  Navigation
                </h3>
              </div>
              
              {/* Menu Items */}
              <ul className="list-none flex flex-col p-4">
                {navLinks.map((nav, index) => (
                  <li key={nav.id}>
                    <ScrollLink
                      to={nav.id}
                      smooth={true}
                      duration={500}
                      offset={-70}
                      onClick={() => {
                        setActive(nav.title);
                        setToggle(false);
                      }}
                      href={nav.id}
                      className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        active === nav.title
                          ? "bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 border border-[#00C6FE]/50"
                          : "hover:bg-white/5 border border-transparent hover:border-white/10"
                      }`}
                    >
                      {/* Icon indicator */}
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        active === nav.title 
                          ? "bg-gradient-to-r from-[#00C6FE] to-purple-500" 
                          : "bg-white/30 group-hover:bg-white/50"
                      }`} />
                      
                      {/* Title */}
                      <span className={`font-medium text-base transition-all duration-300 ${
                        active === nav.title
                          ? "text-white"
                          : "text-gray-300 group-hover:text-white"
                      }`}>
                        {nav.title}
                      </span>
                      
                      {/* Arrow indicator for active */}
                      {active === nav.title && (
                        <svg className="w-4 h-4 ml-auto text-[#00C6FE]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </ScrollLink>
                    
                    {/* Divider (not for last item) */}
                    {index < navLinks.length - 1 && (
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
