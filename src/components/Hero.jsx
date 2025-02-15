import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLinkedin,
  faGithub,
  faMedium,
} from "@fortawesome/free-brands-svg-icons";
import { Link as ScrollLink } from "react-scroll";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";

const IconWithTooltip = ({ icon, href, tooltip }) => (
  <div className="relative inline-block group">
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={tooltip}
      className="text-white text-2xl transition-transform duration-300 transform group-hover:scale-110"
    >
      <FontAwesomeIcon icon={icon} 
      className="transition-transform duration-300 transform group-hover:scale-110"/>
      <span className="sr-only">{tooltip}</span>
    </a>
    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
      {tooltip}
    </div>
  </div>
);

const Hero = () => {
  const downloadCV = () => {
    const cv = "./CV.pdf";
    const link = document.createElement("a");
    link.href = cv;
    link.download = "Tiago_Dias_CV.pdf";
    link.click();
  };

  return (
    <div className="flex justify-center items-center h-[calc(95vh)] bg-primary py-6">
      <div className="flex flex-col justify-between h-[85%] w-full max-w-[1900px] purple-500 text-white rounded-2xl p-8 box-border overflow-hidden">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center bg-[#ffffff] px-2 py-2 rounded-full hover:scale-110 transition-transform duration-300 cursor-pointer">
            <ScrollLink
              to="contact"
              smooth={true}
              duration={500}
              className="text-[#1E1E1E] text-sm font-bold uppercase"
              href="contact"
            >
              OPEN TO WORK &nbsp;
            </ScrollLink>
            <div className="w-2.5 h-2.5 rounded-full bg-[#000000] animate-blink"></div>
          </div>
          <a
            href="./CV.pdf"
            download="Tiago_Dias_CV.pdf"
            className="bg-white text-[#1E1E1E] text-sm px-3 py-2 rounded-full font-bold uppercase transition-transform duration-300 transform hover:scale-110"
          >
            DOWNLOAD CV
          </a>
        </div>

        <div className="text-center mt-5">
          <h2 className={styles.sectionHeadText}>
            JUNIOR
            <br />
            SOFTWARE DEVELOPER.
          </h2>
          <br></br>
          <div className="text-lg text-[#CCCCCC] leading-relaxed">
            Hi, I’m <b>Tiago</b>, passionate about building efficient and
            user-friendly software solutions. Let’s build something great
            together!
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          <div className="flex items-center gap-5">
            <div className="flex gap-5">
              <IconWithTooltip
                href="https://www.linkedin.com/in/tiagofdias/"
                icon={faLinkedin}
                tooltip="LinkedIn"
              />
              <IconWithTooltip
                href="https://github.com/tiagofdias"
                icon={faGithub}
                tooltip="GitHub"
              />
            </div>

            <ScrollLink
              to="about"
              href="about"
              smooth={true}
              duration={500}
              className="bg-white text-[#1E1E1E] text-sm px-3 py-2 rounded-full font-bold uppercase transition-transform duration-300 transform hover:scale-110 cursor-pointer"
            >
              ABOUT ME
            </ScrollLink>
          </div>
          <ScrollLink
            to="projects"
            href="projects"
            smooth={true}
            duration={500}
            aria-label="Scroll to about section" // accessible name
            className="flex items-center cursor-pointer transition-transform duration-300 transform hover:scale-110"
          >
            <svg
              className="w-6 h-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14"></path>
              <path d="M19 12l-7 7-7-7"></path>
            </svg>
          </ScrollLink>
        </div>
      </div>
    </div>
  );
};

export default SectionWrapper(Hero, "hero");
