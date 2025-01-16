import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub, faMedium } from "@fortawesome/free-brands-svg-icons";
import { Link as ScrollLink } from "react-scroll";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";

const Hero = () => {
  const downloadCV = () => {
    const cv = "./CV.pdf";
    const link = document.createElement("a");
    link.href = cv;
    link.download = "Tiago_Dias_CV.pdf";
    link.click();
  };

  return (
    <div className="flex justify-center items-center h-[calc(95vh)] bg-[#050816] py-6">
    <div className="flex flex-col justify-between h-[85%] w-full max-w-[1900px] purple-500 text-white rounded-2xl p-8 box-border overflow-hidden">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center bg-[#ffffff] px-2 py-2 rounded-full hover:scale-110 transition-transform duration-300 cursor-pointer">
        <ScrollLink
    to="contact"
    smooth={true}
    duration={500}
    className="text-[#1E1E1E] text-sm font-bold uppercase"
  >
    OPEN TO WORK &nbsp;
  </ScrollLink>
          <div className="w-2.5 h-2.5 rounded-full bg-[#000000] animate-blink"></div>
        </div>
        <button
          onClick={downloadCV}
          className="bg-white text-[#1E1E1E] text-sm px-3 py-2 rounded-full font-bold uppercase transition-transform duration-300 transform hover:scale-110"
        >
          DOWNLOAD CV
        </button>
      </div>

        <div className="text-center mt-5">
          <h2 className={styles.sectionHeadText}>
            JUNIOR
            <br />
            SOFTWARE DEVELOPER.
          </h2>
          <p className="text-lg text-[#CCCCCC] leading-relaxed">
            Hi, I’m <b>Tiago</b>, passionate about building efficient and user-friendly
            software solutions. Let’s build something great together!
          </p>
        </div>

        <div className="flex justify-between items-center mt-5">
          <div className="flex items-center gap-5">
            <div className="flex gap-5">
              <a
                href="https://www.linkedin.com/in/tiagofdias/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-2xl transition-transform duration-300 transform hover:scale-110"
              >
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
              <a
                href="https://github.com/tiagofdias"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-2xl transition-transform duration-300 transform hover:scale-110"
              >
                <FontAwesomeIcon icon={faGithub} />
              </a>
              <a
                href="https://medium.com/@tiagofdias"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-2xl transition-transform duration-300 transform hover:scale-110"
              >
                <FontAwesomeIcon icon={faMedium} />
              </a>
            </div>

            <ScrollLink
              to="projects"
              smooth={true}
              duration={500}
              className="bg-white text-[#1E1E1E] text-sm px-3 py-2 rounded-full font-bold uppercase transition-transform duration-300 transform hover:scale-110 cursor-pointer"
            >
              PROJECTS
            </ScrollLink>
          </div>
          <ScrollLink
            to="about"
            smooth={true}
            duration={500}
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

