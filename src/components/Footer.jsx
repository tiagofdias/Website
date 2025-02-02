import React from "react";
import { SectionWrapper } from "../hoc";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link as ScrollLink } from "react-scroll";
import {
  faLinkedin,
  faGithub,
  faMedium,
} from "@fortawesome/free-brands-svg-icons";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="colors-primary text-white py-10 px-6 mt-0 sm:mt-4 md:mt-0">
      <div className="grid gap-6">
        <div className="text-white p-6 rounded-md">
          <h2 className="text-xl font-bold mb-3">Tiago Dias</h2>
          <p className="mb-4">
            Junior Software Developer.
          </p>
          <div className="flex justify-between items-center mt-5">
            <div className="flex items-center gap-5">
              <div className="flex gap-5">
                {/* LinkedIn Button */}
                <div className="relative inline-block group">
                  <a
                    href="https://www.linkedin.com/in/tiagofdias/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-white text-2xl transition-transform duration-300 transform group-hover:scale-110"
                  >
                    <FontAwesomeIcon icon={faLinkedin} />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                </div>
                {/* GitHub Button */}
                <div className="relative inline-block group">
                  <a
                    href="https://github.com/tiagofdias"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="text-white text-2xl transition-transform duration-300 transform group-hover:scale-110"
                  >
                    <FontAwesomeIcon icon={faGithub} />
                    <span className="sr-only">GitHub</span>
                  </a>
                </div>
                {/* Medium Button */}
                <div className="relative inline-block group">
                  <a
                    href="https://medium.com/@tiagofdias"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Medium"
                    className="text-white text-2xl transition-transform duration-300 transform group-hover:scale-110"
                  >
                    <FontAwesomeIcon icon={faMedium} />
                    <span className="sr-only">Medium</span>
                  </a>
                </div>
              </div>
            </div>
            <ScrollLink
              to="hero"
              smooth={true}
              duration={500}
              className="flex items-center cursor-pointer transition-transform duration-300 transform hover:scale-110"
            >
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5"></path>
                <path d="M5 12l7-7 7 7"></path>
              </svg>
            </ScrollLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SectionWrapper(Footer, "footer");




