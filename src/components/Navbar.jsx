import React, { useEffect, useState } from "react";
import { Link as ScrollLink } from "react-scroll";
import { Link } from "react-router-dom";
import { styles } from "../styles";
import { navLinks } from "../constants";
import { menu, close } from "../assets";
import cv from "./CV.pdf";

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
    if (nav.title === "Download CV") {
      const link = document.createElement("a");
      link.href = cv;
      link.download = "Tiago_Dias_CV.pdf";
      link.click();
    }
  };

  return (
    <nav
      className={`${
        styles.paddingX
      } w-full flex items-center py-5 fixed top-0 z-20 ${
        scrolled ? "bg-primary" : "bg-transparent"
      }`}
    >
      <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
        <ScrollLink
          to="hero" // The ID of the target section
          smooth={true} // Enables smooth scrolling
          duration={500} // Duration of the scroll in milliseconds
          offset={-50} // Adjust scroll offset if needed (e.g., for a fixed header)
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setActive("")} // Reset active state on click
        >
          <p className="text-white text-[18px] font-bold flex">
            Tiago &nbsp;
            <span className="sm:block hidden"> Dias</span>
          </p>
        </ScrollLink>

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
                offset={-70} // Adjust for fixed navbar height
                onClick={() => setActive(nav.title)}
              >
                {nav.title}
              </ScrollLink>
            </li>
          ))}
        </ul>

        <div className="sm:hidden flex flex-1 justify-end items-center menu-container">
          <img
            src={toggle ? close : menu}
            alt="menu"
            className="menu-icon"
            onClick={() => setToggle(!toggle)}
          />

          <div
            className={`${
              !toggle ? "hidden" : "flex"
            } p-6 black-gradient absolute top-20 right-0 mx-4 my-2 min-w-[140px] z-10 rounded-xl`}
          >
            <ul className="list-none flex justify-end items-start flex-1 flex-col gap-4">
              {navLinks.map((nav) => (
                <li
                  key={nav.id}
                  className={`font-poppins font-medium cursor-pointer text-[16px] ${
                    active === nav.title ? "text-secondary" : "text-secondary"
                  }`}
                  onClick={() => {
                    setToggle(!toggle);
                    handleNavClick(nav);
                  }}
                >
                  <ScrollLink
                    to={nav.id}
                    smooth={true}
                    duration={500}
                    offset={-70}
                    onClick={() => setActive(nav.title)}
                  >
                    {nav.title}
                  </ScrollLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
