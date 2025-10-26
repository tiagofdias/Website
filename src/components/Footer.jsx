import React from "react";
import { SectionWrapper } from "../hoc";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link as ScrollLink } from "react-scroll";
import {
  faLinkedin,
  faGithub,
  faMedium,
} from "@fortawesome/free-brands-svg-icons";

const IconWithTooltip = ({ icon, href, tooltip }) => (
  <div className="relative inline-block group">
    <div
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={tooltip}
      className="text-white text-2xl transition-transform duration-300 transform group-hover:scale-110"
    >

      <div className="transition-transform duration-300 transform group-hover:scale-110">
        <FontAwesomeIcon icon={icon} />
      </div>
      <span className="sr-only">{tooltip}</span>
    </div>
    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
      {tooltip}
    </div>
  </div>
);


const Footer = () => {
  return (
    <footer className="colors-primary text-white py-10 px-6 mt-0 sm:mt-4 md:mt-0">
      <div className="grid gap-6">
        <div className="text-white p-6 rounded-md">
          <h2 className="text-xl font-bold mb-3">Tiago Dias</h2>
          <p className="mb-4">Junior Software Developer.</p>
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
                    <IconWithTooltip
                      href="https://www.linkedin.com/in/tiagofdias/"
                      icon={faLinkedin}
                      tooltip="LinkedIn"
                    />
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
                    <IconWithTooltip
                      href="https://github.com/tiagofdias"
                      icon={faGithub}
                      tooltip="GitHub"
                    />
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
                    className="text-black text-2xl transition-transform duration-300 transform group-hover:scale-110"
                  >
                    <span className="sr-only">Medium</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SectionWrapper(Footer, "footer");
