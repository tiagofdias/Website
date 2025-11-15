import React, { useState, useEffect, useMemo } from "react";
import { TypeAnimation } from "react-type-animation";
import { motion, AnimatePresence } from "framer-motion";
import "react-vertical-timeline-component/style.min.css";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import {
  css,
  docker,
  figma,
  git,
  html,
  javascript,
  mongodb,
  nodejs,
  reactjs,
  redux,
  tailwind,
  typescript,
  threejs,
} from "../assets";

const API_URL = import.meta.env.VITE_API_URL;

const normalizeTechKey = (value = "") =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const TECH_ICON_MAP = new Map([
  ["javascript", javascript],
  ["js", javascript],
  ["typescript", typescript],
  ["ts", typescript],
  ["html", html],
  ["css", css],
  ["react", reactjs],
  ["reactjs", reactjs],
  ["reactnative", reactjs],
  ["nextjs", reactjs],
  ["node", nodejs],
  ["nodejs", nodejs],
  ["express", nodejs],
  ["mongodb", mongodb],
  ["mongo", mongodb],
  ["tailwind", tailwind],
  ["tailwindcss", tailwind],
  ["docker", docker],
  ["figma", figma],
  ["git", git],
  ["redux", redux],
  ["reduxtoolkit", redux],
  ["threejs", threejs],
]);

const TECH_CARD_GRADIENTS = [
  "from-[#00C6FE]/50 via-[#4ECDC4]/20 to-purple-500/50",
  "from-purple-500/50 via-[#00C6FE]/15 to-[#14F4C9]/40",
  "from-[#845EF7]/50 via-[#00C6FE]/20 to-[#FF6EC7]/40",
  "from-[#00A2FF]/50 via-[#7C3AED]/20 to-[#14F4C9]/40",
];

const getTechIcon = (name) => TECH_ICON_MAP.get(normalizeTechKey(name));

const getInitials = (name = "") =>
  name
    .split(/\s|-/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

// -------------------------
// Custom hook to detect mobile devices based on viewport width
// -------------------------
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

// -------------------------
// About Section
// -------------------------
const About = () => {
  const [about, setAbout] = useState(null);
  const isMobile = useIsMobile();

  const techItems = useMemo(() => {
    if (!about?.devskills) return [];

    try {
      const parsed = JSON.parse(about.devskills);
      const entries = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
        ? parsed.items
        : [];

      const seen = new Set();

      return entries
        .map((entry) => {
          if (typeof entry === "string") {
            return {
              name: entry,
              icon: getTechIcon(entry),
              initials: getInitials(entry),
            };
          }

          if (!entry || typeof entry.name !== "string") return null;

          const displayName = entry.displayName || entry.name;
          const description = entry.description || null;
          const level = entry.level || null;

          const icon =
            getTechIcon(entry.name) || getTechIcon(displayName);

          return {
            name: displayName,
            icon,
            initials: getInitials(displayName),
            description,
            level,
          };
        })
        .filter((item) => {
          if (!item || !item.name) return false;
          const key = normalizeTechKey(item.name);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    } catch (error) {
      console.error("Failed to parse devskills field", error);
      return [];
    }
  }, [about?.devskills]);

  useEffect(() => {
    fetch(`${API_URL}/about`)
      .then((res) => res.json())
      .then((data) => {
        const aboutData = Array.isArray(data) ? data[0] : data;
        setAbout(aboutData);
      })
      .catch(console.error);
  }, []);

  if (!about) return null;

  return (
    <>
      {/* Section Header with Premium Design */}
      <motion.div
        initial={isMobile ? {} : { opacity: 0, y: -20 }}
        whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="relative inline-block">
          {/* Animated gradient background */}
          <motion.div
            className="absolute -inset-4 bg-gradient-to-r from-[#00C6FE]/10 via-purple-500/10 to-[#00C6FE]/10 rounded-3xl blur-2xl"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <div className="relative">
            <p className={`${styles.sectionSubText} text-[#00C6FE]`}>Introduction</p>
            <h2 className="text-white font-black md:text-[60px] sm:text-[50px] xs:text-[40px] text-[30px]">
              About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6FE] via-cyan-300 to-purple-500">
                Me.
              </span>
            </h2>
            <motion.div
              className="h-1 w-24 bg-gradient-to-r from-[#00C6FE] to-purple-500 mx-auto mt-4 rounded-full"
              initial={isMobile ? { opacity: 1 } : { scaleX: 0, opacity: 0 }}
              whileInView={isMobile ? {} : { scaleX: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ transformOrigin: "center" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Main Content - Premium Card with Floating Effect */}
      <motion.div 
        initial={isMobile ? {} : { opacity: 0, y: 30 }}
        whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mt-12 relative group"
      >
        {/* Outer glow effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-[#00C6FE] via-purple-500 to-[#00C6FE] rounded-3xl blur-xl opacity-0 group-hover:opacity-30"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 100%" }}
        />

        {/* Main card */}
        <div className="relative backdrop-blur-xl bg-gradient-to-br from-tertiary/80 to-tertiary/60 border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00C6FE]/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
          
          {/* Content */}
          <div className="relative z-10 p-8 sm:p-10 lg:p-12">
            {/* Text content with enhanced styling */}
            <motion.div
              initial={isMobile ? {} : { opacity: 0, x: -20 }}
              whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-secondary text-[17px] sm:text-[18px] lg:text-[19px] max-w-4xl leading-[32px]"
            >
              {about.content &&
                about.content.map((part, i) =>
                  part.link ? (
                    <a
                      key={i}
                      href={part.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative font-bold group/link"
                      style={{
                        fontWeight: part.bold ? "bold" : "normal",
                        color: part.color || "#00C6FE",
                      }}
                    >
                      <span className="relative z-10 group-hover/link:text-white transition-colors duration-300">
                        {part.text}
                      </span>
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00C6FE] to-purple-500 group-hover/link:w-full transition-all duration-300" />
                    </a>
                  ) : (
                    <span
                      key={i}
                      style={{
                        fontWeight: part.bold ? "bold" : "normal",
                        color: part.color || undefined,
                        marginRight: 2,
                      }}
                    >
                      {part.text}
                    </span>
                  )
                )}
              {" "}
              <TypeAnimation
                sequence={about.languages.flatMap((lang) => [lang, 3000])}
                wrapper="span"
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6FE] via-cyan-300 to-purple-500 text-[17px] sm:text-[18px] lg:text-[19px] leading-[32px] font-black drop-shadow-[0_0_15px_rgba(0,198,254,0.5)]"
                speed={50}
                repeat={Infinity}
              />
            </motion.div>

            {/* Divider with animation */}
            <motion.div
              initial={isMobile ? {} : { scaleX: 0 }}
              whileInView={isMobile ? {} : { scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="my-10 h-px bg-gradient-to-r from-transparent via-[#00C6FE] to-transparent"
            />

            {/* Skills Section - Enhanced */}
            <motion.div 
              initial={isMobile ? {} : { opacity: 0, y: 20 }}
              whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="mb-6 sm:mb-6">
                <h3 className="text-white font-bold text-3xl sm:text-3xl mb-2 flex items-center gap-3">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6FE] to-purple-500">
                    Tech Stack
                  </span>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-2 h-2 bg-[#00C6FE] rounded-full shadow-[0_0_10px_rgba(0,198,254,0.8)]"
                  />
                </h3>
                <p className="text-gray-400 text-base sm:text-sm">Technologies I work with</p>
              </div>

              <div className="relative group/skills">
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-[#00C6FE] via-purple-500 to-[#00C6FE] rounded-3xl opacity-0 group-hover/skills:opacity-50 blur-xl"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% 100%" }}
                />

                <div className="relative overflow-hidden rounded-3xl border-2 border-white/10 bg-[#0b1226]/80 p-6 sm:p-8 transition-all duration-500 backdrop-blur-xl group-hover/skills:border-[#00C6FE]/40">
                  {techItems.length > 0 ? (
                    <>
                      <motion.div
                        className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-[#00C6FE]/25 blur-3xl"
                        animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 6, repeat: Infinity }}
                      />
                      <motion.div
                        className="pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-purple-500/25 blur-[110px]"
                        animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.8, 1.05, 0.8] }}
                        transition={{ duration: 7, repeat: Infinity }}
                      />

                      <div className="relative grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                        {techItems.map((tech, index) => (
                          <motion.div
                            key={`${tech.name}-${index}`}
                            className="relative group/tech"
                            whileHover={
                              isMobile
                                ? {}
                                : {
                                    y: -6,
                                    rotate: -1,
                                  }
                            }
                            transition={{ type: "spring", stiffness: 260, damping: 18 }}
                          >
                            <div
                              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${TECH_CARD_GRADIENTS[index % TECH_CARD_GRADIENTS.length]} opacity-70 blur-md transition-opacity duration-500 group-hover/tech:opacity-100`}
                            />

                            <div className="relative flex h-full flex-col items-center justify-center gap-4 md:gap-3 rounded-2xl border border-white/10 bg-[rgba(12,19,40,0.85)] px-4 py-8 md:px-5 md:py-6 text-center shadow-[0_8px_24px_rgba(5,8,38,0.45)]">
                              {tech.icon ? (
                                <motion.img
                                  src={tech.icon}
                                  alt={`${tech.name} icon`}
                                  className="h-16 w-16 md:h-12 md:w-12 object-contain drop-shadow-[0_6px_18px_rgba(0,198,254,0.35)]"
                                  initial={{ scale: 0.85, opacity: 0.8 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.4 }}
                                />
                              ) : (
                                <span className="flex h-16 w-16 md:h-12 md:w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00C6FE] to-purple-500 text-lg md:text-sm font-black text-white shadow-[0_8px_16px_rgba(0,198,254,0.35)]">
                                  {tech.initials}
                                </span>
                              )}

                              <span className="text-lg md:text-base font-semibold text-white leading-tight">
                                {tech.name}
                              </span>
                              <span className="text-[10px] uppercase tracking-[0.4em] md:tracking-[0.5em] text-white/40 font-medium">
                                Stack
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 opacity-5"
                        style={{
                          backgroundImage:
                            "linear-gradient(rgba(0,198,254,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,198,254,0.5) 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }}
                      />

                      <motion.img
                        src={about.skills}
                        alt="skills"
                        className="relative z-10 w-full transform transition-transform duration-500"
                        style={{ filter: "saturate(1.4) brightness(1.1) hue-rotate(8deg)" }}
                        whileHover={{ scale: 1.02 }}
                      />

                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// -------------------------
// Timeline Section Components
// -------------------------
const TimelineItem = ({ item, index, isMobile }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={isMobile ? {} : { opacity: 0, x: -20 }}
      whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
      
      <div className="relative backdrop-blur-sm bg-tertiary/50 border border-white/10 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-[#00C6FE]/10 transition-all duration-500">
        {/* Timeline Dot */}
        <div className="absolute top-6 left-[-34px] w-4 h-4 bg-gradient-to-r from-[#00C6FE] to-purple-500 rounded-full border-2 border-[#00C6FE] shadow-lg shadow-[#00C6FE]/50 group-hover:scale-125 transition-transform duration-300"></div>

        {/* Clickable Header */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Date Badge */}
              <div className="inline-block bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 backdrop-blur-sm border border-[#00C6FE]/30 rounded-full px-4 py-1 mb-3">
                <p className="text-sm font-semibold text-[#00C6FE]">{item.date}</p>
              </div>

              {/* Title with Link */}
              <h3 className="text-white font-bold text-[20px] mb-1">
                {item.titleLink ? (
                  <a
                    href={item.titleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#00C6FE] hover:to-purple-500 transition-all duration-300"
                  >
                    {item.title}
                  </a>
                ) : (
                  <span>{item.title}</span>
                )}
              </h3>

              {/* Company Name with Link */}
              {item.company_name && (
                <p className="text-[16px] text-gray-300">
                  {item.companyLink ? (
                    <a
                      href={item.companyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-[#00C6FE] transition-colors duration-300"
                    >
                      {item.company_name}
                    </a>
                  ) : (
                    item.company_name
                  )}
                </p>
              )}
            </div>

            {/* Expand/Collapse Icon */}
            {item.points?.length > 0 && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0 mt-2"
              >
                <svg 
                  className="w-6 h-6 text-[#00C6FE]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            )}
          </div>
        </div>

        {/* Expandable Bullet Points */}
        <AnimatePresence>
          {isExpanded && item.points?.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <ul className="text-[15px] text-secondary mt-4 pt-4 border-t border-white/10 space-y-3">
                {item.points.map((point, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start group/item"
                  >
                    <span className="mr-3 text-[#00C6FE] font-bold group-hover/item:scale-125 transition-transform duration-300">•</span>
                    <span className="flex-1">{point.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const TimelineSection = ({ items, sectionTitle, isMobile }) => {
  return (
    <motion.div 
      initial={isMobile ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-8">
        {sectionTitle}
      </h2>
      <div className="relative border-l-4 border-gradient-to-b from-[#00C6FE] via-purple-500 to-[#00C6FE] pl-6 space-y-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-[#00C6FE] before:via-purple-500 before:to-[#00C6FE] before:blur-sm">
        {items.map((item, index) => (
          <TimelineItem key={index} item={item} index={index} isMobile={isMobile} />
        ))}
      </div>
    </motion.div>
  );
};

const Timeline = () => {
  const isMobile = useIsMobile();
  const [showAll, setShowAll] = useState(true);
  const [activeTab, setActiveTab] = useState("education"); // "education" or "experience"
  const [education, setEducation] = useState([]);
  const [proexp, setProexp] = useState([]);

  useEffect(() => {
    // Fetch and filter education data
    fetch(`${API_URL}/education`)
      .then((res) => res.json())
      .then((data) => {
        const enabledEducation = data
          .filter(item => item.enabled)
          .sort((a, b) => a.order - b.order);
        setEducation(enabledEducation);
      })
      .catch((err) => console.error("Failed to fetch education:", err));

    // Fetch and filter professional experience data
    fetch(`${API_URL}/proexp`)
      .then((res) => res.json())
      .then((data) => {
        const enabledProexp = data
          .filter(item => item.enabled)
          .sort((a, b) => a.order - b.order);
        setProexp(enabledProexp);
      })
      .catch((err) => console.error("Failed to fetch proexp:", err));

    // Listen for tab change events from chat
    const handleTabChange = (event) => {
      const { tab, expand } = event.detail;
      console.log('📋 My Journey tab change event received:', { tab, expand });
      
      if (expand) {
        setShowAll(true);
        console.log('  ✓ Expanded timeline');
      }
      
      if (tab === 'education' || tab === 'experience') {
        setActiveTab(tab);
        console.log('  ✓ Switched to tab:', tab);
      }
    };

    window.addEventListener('changeMyJourneyTab', handleTabChange);
    
    return () => {
      window.removeEventListener('changeMyJourneyTab', handleTabChange);
    };
  }, []);

  if (!showAll) {
    return (
      <motion.div 
        className="flex justify-center mt-10"
        initial={isMobile ? {} : { opacity: 0, y: 20 }}
        whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <motion.button
          onClick={() => setShowAll(true)}
          whileHover={isMobile ? {} : { scale: 1.05, x: 5 }}
          whileTap={isMobile ? {} : { scale: 0.95 }}
          className="group relative bg-gradient-to-r from-[#00C6FE] to-purple-500 hover:from-[#00C6FE]/90 hover:to-purple-500/90 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-[#00C6FE]/30 outline-none text-white font-bold py-4 px-12 rounded-full overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          
          <span className="relative flex items-center gap-2">
            Tell me More
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <>
      {/* Premium Journey Header */}
      <motion.div
        initial={isMobile ? {} : { opacity: 0, y: -20 }}
        whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mb-8 text-center"
      >
        {/* Animated gradient background */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 -inset-4 bg-gradient-to-r from-purple-500/10 via-[#00C6FE]/10 to-purple-500/10 rounded-3xl blur-2xl"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        <div className="relative inline-block">
          <p className={`${styles.sectionSubText} text-purple-400`}>Career Path</p>
          <h2 className="text-white font-black md:text-[60px] sm:text-[50px] xs:text-[40px] text-[30px] flex items-center justify-center gap-4">
            My{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-[#00C6FE] to-purple-500">
              Journey
            </span>
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="hidden sm:block"
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#00C6FE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </motion.div>
          </h2>
          <motion.div
            className="h-1 w-24 bg-gradient-to-r from-[#00C6FE] to-purple-500 mx-auto mt-4 rounded-full"
            initial={isMobile ? { opacity: 1 } : { scaleX: 0, opacity: 0 }}
            whileInView={isMobile ? {} : { scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ transformOrigin: "center" }}
          />
        </div>
      </motion.div>

      {/* Premium Tab Navigation */}
      <motion.div 
        initial={isMobile ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative mb-12"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00C6FE]/5 to-transparent blur-xl" />
        
        <div className="relative flex justify-center gap-3 sm:gap-4 flex-wrap">
          <motion.button
            onClick={() => setActiveTab("experience")}
            whileHover={isMobile ? {} : { scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`relative px-8 sm:px-10 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-[16px] transition-all duration-300 overflow-hidden shadow-lg ${
              activeTab === "experience"
                ? "text-white shadow-[0_0_30px_rgba(0,198,254,0.4)]"
                : "backdrop-blur-sm bg-tertiary/50 border border-white/10 text-gray-400 hover:text-white hover:border-[#00C6FE]/30 hover:shadow-[0_0_20px_rgba(0,198,254,0.2)]"
            }`}
          >
            {activeTab === "experience" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-[#00C6FE] to-purple-500 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Experience
            </span>
          </motion.button>
        
          <motion.button
            onClick={() => setActiveTab("education")}
            whileHover={isMobile ? {} : { scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`relative px-8 sm:px-10 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-[16px] transition-all duration-300 overflow-hidden shadow-lg ${
              activeTab === "education"
                ? "text-white shadow-[0_0_30px_rgba(0,198,254,0.4)]"
                : "backdrop-blur-sm bg-tertiary/50 border border-white/10 text-gray-400 hover:text-white hover:border-[#00C6FE]/30 hover:shadow-[0_0_20px_rgba(0,198,254,0.2)]"
            }`}
          >
            {activeTab === "education" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-[#00C6FE] to-purple-500 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Education
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Timeline Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "education" ? (
            <TimelineSection items={education} sectionTitle="Education" isMobile={isMobile} />
          ) : (
            <TimelineSection items={proexp} sectionTitle="Experience" isMobile={isMobile} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

// -------------------------
// Export About Section (Introduction)
// -------------------------
export const AboutSection = SectionWrapper(About, "about");

// -------------------------
// Export My Journey (Timeline with tabs)
// -------------------------
export const MyJourney = SectionWrapper(Timeline, "myjourney");

// Default export for backward compatibility
export default AboutSection;





