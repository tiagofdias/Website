import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionWrapper } from "../hoc";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link as ScrollLink } from "react-scroll";
import {
  faLinkedin,
  faGithub,
  faMedium,
} from "@fortawesome/free-brands-svg-icons";
import useIsMobile from "../utils/useIsMobile";

const IconWithTooltip = ({ icon, href, tooltip, isMobile }) => (
  <motion.div 
    className="relative inline-block group"
    whileHover={isMobile ? {} : { scale: 1.1 }}
    whileTap={isMobile ? {} : { scale: 0.95 }}
  >
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={tooltip}
      className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm border border-white/30 hover:border-white/60 rounded-full text-white transition-all duration-300 hover:shadow-glow-lg"
    >
      <FontAwesomeIcon icon={icon} className="text-base sm:text-lg" />
      <span className="sr-only">{tooltip}</span>
    </a>
    <div className="absolute bottom-full mb-1.5 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-[10px] sm:text-xs px-2 py-0.5 rounded whitespace-nowrap pointer-events-none transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
      {tooltip}
    </div>
  </motion.div>
);


const Footer = () => {
  const isMobile = useIsMobile();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative bg-primary text-white py-4 sm:py-6 lg:py-6 px-3 sm:px-4 mt-2 sm:mt-4 overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#00C6FE]/10 to-transparent pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Main Content */}
        <motion.div 
          className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 lg:p-6"
          initial={isMobile ? {} : { opacity: 0, y: 30 }}
          whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6 text-center md:text-left">
            {/* Brand Section */}
            <motion.div
              initial={isMobile ? {} : { opacity: 0, x: -20 }}
              whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-1 bg-gradient-to-r from-[#00C6FE] via-cyan-300 to-purple-500 bg-clip-text text-transparent">
                Tiago Dias
              </h2>
              <p className="text-gray-200 text-[11px] sm:text-xs mb-1.5 sm:mb-2">Software Engineer</p>
              <p className="text-gray-300 text-[11px] sm:text-xs leading-relaxed max-w-sm mx-auto md:mx-0">
                Building innovative solutions with passion and precision. Let's create something amazing together.
              </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={isMobile ? {} : { opacity: 0, y: 20 }}
              whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col gap-1.5 sm:gap-2 items-center md:items-start"
            >
              <h3 className="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1 text-[#00C6FE]">Quick Links</h3>
              {['projects', 'about', 'certifications', 'blog', 'contact'].map((section) => (
                <ScrollLink
                  key={section}
                  to={section}
                  smooth={true}
                  duration={500}
                  className="text-gray-200 hover:text-white text-[11px] sm:text-xs cursor-pointer transition-colors duration-300 hover:translate-x-1 transform inline-block w-fit capitalize"
                >
                  {section}
                </ScrollLink>
              ))}
            </motion.div>

            {/* Connect Section */}
            <motion.div
              initial={isMobile ? {} : { opacity: 0, x: 20 }}
              whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-2.5 text-[#00C6FE]">Let's Connect</h3>
              <div className="flex gap-2.5 sm:gap-3 justify-center md:justify-start">
                <IconWithTooltip
                  href="https://www.linkedin.com/in/tiagofdias/"
                  icon={faLinkedin}
                  tooltip="LinkedIn"
                  isMobile={isMobile}
                />
                <IconWithTooltip
                  href="https://github.com/tiagofdias"
                  icon={faGithub}
                  tooltip="GitHub"
                  isMobile={isMobile}
                />
                <IconWithTooltip
                  href="https://medium.com/@tiagofdias"
                  icon={faMedium}
                  tooltip="Medium"
                  isMobile={isMobile}
                />
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 my-2.5 sm:my-3.5"></div>

          {/* Bottom Bar */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 text-center sm:text-left"
            initial={isMobile ? {} : { opacity: 0 }}
            whileInView={isMobile ? {} : { opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-gray-300 text-[11px] sm:text-xs">
              © {currentYear} Tiago Dias. All rights reserved.
            </p>
            
            {/* Scroll to Top */}
            <motion.div
              whileHover={isMobile ? {} : { scale: 1.08, rotate: -3 }}
              whileTap={isMobile ? {} : { scale: 0.95 }}
            >
              <ScrollLink
                to="hero"
                smooth={true}
                duration={500}
                className="flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 backdrop-blur-sm border border-[#00C6FE]/30 hover:border-[#00C6FE]/60 rounded-full cursor-pointer transition-all duration-300 hover:shadow-md hover:shadow-[#00C6FE]/20 group"
              >
                <span className="text-[11px] sm:text-xs font-medium">Back to Top</span>
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white group-hover:-translate-y-0.5 transition-transform duration-300"
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
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};

export default SectionWrapper(Footer, "footer");
