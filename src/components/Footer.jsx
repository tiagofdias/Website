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

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

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
      className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/30 hover:border-white/60 rounded-full text-white transition-all duration-300 hover:shadow-glow-lg"
    >
      <FontAwesomeIcon icon={icon} className="text-xl" />
      <span className="sr-only">{tooltip}</span>
    </a>
    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
      {tooltip}
    </div>
  </motion.div>
);


const Footer = () => {
  const isMobile = useIsMobile();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative colors-primary text-white py-16 px-6 mt-12 overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#00C6FE]/10 to-transparent pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Main Content */}
        <motion.div 
          className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12"
          initial={isMobile ? {} : { opacity: 0, y: 30 }}
          whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <motion.div
              initial={isMobile ? {} : { opacity: 0, x: -20 }}
              whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#00C6FE] via-cyan-300 to-purple-500 bg-clip-text text-transparent">
                Tiago Dias
              </h2>
              <p className="text-gray-200 text-sm mb-4">Software Engineer</p>
              <p className="text-gray-200 text-xs leading-relaxed">
                Building innovative solutions with passion and precision. Let's create something amazing together.
              </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={isMobile ? {} : { opacity: 0, y: 20 }}
              whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col gap-3"
            >
              <h3 className="text-lg font-semibold mb-2 text-[#00C6FE]">Quick Links</h3>
              {['projects', 'about', 'certifications', 'blog', 'contact'].map((section, idx) => (
                <ScrollLink
                  key={section}
                  to={section}
                  smooth={true}
                  duration={500}
                  className="text-gray-200 hover:text-white text-sm cursor-pointer transition-colors duration-300 hover:translate-x-1 transform inline-block w-fit capitalize"
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
              <h3 className="text-lg font-semibold mb-4 text-[#00C6FE]">Let's Connect</h3>
              <div className="flex gap-4">
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
          <div className="border-t border-white/10 my-6"></div>

          {/* Bottom Bar */}
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-center gap-4"
            initial={isMobile ? {} : { opacity: 0 }}
            whileInView={isMobile ? {} : { opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-gray-200 text-sm">
              © {currentYear} Tiago Dias. All rights reserved.
            </p>
            
            {/* Scroll to Top */}
            <motion.div
              whileHover={isMobile ? {} : { scale: 1.1, rotate: -5 }}
              whileTap={isMobile ? {} : { scale: 0.95 }}
            >
              <ScrollLink
                to="hero"
                smooth={true}
                duration={500}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 backdrop-blur-sm border border-[#00C6FE]/30 hover:border-[#00C6FE]/60 rounded-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-[#00C6FE]/20 group"
              >
                <span className="text-sm font-medium">Back to Top</span>
                <svg
                  className="w-4 h-4 text-white group-hover:-translate-y-1 transition-transform duration-300"
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
