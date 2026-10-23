import React, { useState, useEffect, useMemo } from "react";
import { TypeAnimation } from "react-type-animation";
import { motion, AnimatePresence } from "framer-motion";
import "react-vertical-timeline-component/style.min.css";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import useIsMobile from "../utils/useIsMobile";
import { fallbackAbout, fallbackEducation, fallbackProexp } from "../data/fallbackData";
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

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
// About Section
// -------------------------
const About = () => {
  const [about, setAbout] = useState(fallbackAbout);
  const isMobile = useIsMobile();

  const techItems = useMemo(() => {
    const rawSkills = about?.devskills || fallbackAbout.devskills || about?.skills;
    if (!rawSkills) return [];

    try {
      let entries = [];
      if (typeof rawSkills === "string") {
        try {
          const parsed = JSON.parse(rawSkills);
          entries = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.items)
            ? parsed.items
            : [];
        } catch {
          entries = rawSkills.split(",").map((s) => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(rawSkills)) {
        entries = rawSkills;
      } else if (Array.isArray(rawSkills?.items)) {
        entries = rawSkills.items;
      }

      if (entries.length === 0) {
        entries = fallbackAbout.devskills || [];
      }

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
  }, [about?.devskills, about?.skills]);

  useEffect(() => {
    fetch(`${API_URL}/about`)
      .then((res) => res.json())
      .then((data) => {
        const aboutData = Array.isArray(data) ? data[0] : data;
        if (aboutData) {
          setAbout({
            ...fallbackAbout,
            ...aboutData,
            devskills: aboutData.devskills || fallbackAbout.devskills,
          });
        }
      })
      .catch(() => {
        // Fallback data already loaded
      });
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
        className="text-center mb-3 sm:mb-4 lg:mb-4 xl:mb-6"
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
            <h2 className="text-white font-black text-2xl xs:text-3xl sm:text-4xl lg:text-4xl xl:text-5xl">
              About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6FE] via-cyan-300 to-purple-500">
                Me.
              </span>
            </h2>
            <motion.div
              className="h-1 w-16 sm:w-20 bg-gradient-to-r from-[#00C6FE] to-purple-500 mx-auto mt-2 sm:mt-2.5 rounded-full"
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
        className="mt-3 sm:mt-5 lg:mt-4 xl:mt-6 relative group"
      >
        {/* Outer glow effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-[#00C6FE] via-purple-500 to-[#00C6FE] rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-hover:opacity-30"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 100%" }}
        />

        {/* Main card */}
        <div className="relative backdrop-blur-xl bg-gradient-to-br from-tertiary/80 to-tertiary/60 border-2 border-white/20 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00C6FE]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          {/* Content: 2-Column Executive Layout on Desktop */}
          <div className="relative z-10 p-3.5 xs:p-5 sm:p-6 lg:p-6 xl:p-8">
            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 xl:gap-8 items-stretch">
              {/* Left Column: Bio & Executive Highlights */}
              <motion.div
                initial={isMobile ? {} : { opacity: 0, x: -20 }}
                whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="lg:w-[44%] xl:w-[42%] flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C6FE]/10 border border-[#00C6FE]/30 mb-2.5 sm:mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#00C6FE] animate-pulse" />
                    <span className="text-[11px] font-semibold text-[#00C6FE] uppercase tracking-wider">Software Engineer</span>
                  </div>
                  <div className="text-secondary text-xs sm:text-sm lg:text-[13px] xl:text-[15px] leading-relaxed max-w-full">
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
                      className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6FE] via-cyan-300 to-purple-500 text-xs sm:text-sm lg:text-[13px] xl:text-[15px] leading-relaxed font-black drop-shadow-[0_0_15px_rgba(0,198,254,0.5)]"
                      speed={50}
                      repeat={Infinity}
                    />
                  </div>
                </div>

                {/* Spoken Languages & Core Highlights Badge */}
                <div className="mt-3.5 sm:mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400">Focus:</span>
                  <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-white">Full Stack</span>
                  <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-white">Cloud Systems</span>
                  <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-white">AI Engineering</span>
                </div>
              </motion.div>

              {/* Vertical divider on desktop */}
              <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/15 to-transparent flex-shrink-0" />

              {/* Right Column: Tech Stack */}
              <motion.div
                initial={isMobile ? {} : { opacity: 0, x: 20 }}
                whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="lg:w-[54%] xl:w-[56%] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                  <h3 className="text-white font-bold text-base sm:text-lg lg:text-base xl:text-xl flex items-center gap-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6FE] to-purple-500">
                      Tech Stack
                    </span>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-1.5 h-1.5 bg-[#00C6FE] rounded-full shadow-[0_0_8px_rgba(0,198,254,0.8)]"
                    />
                  </h3>
                  <span className="text-gray-400 text-[10px] sm:text-[11px]">Primary Tools & Frameworks</span>
                </div>

                <div className="relative group/skills">
                  <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-[#0b1226]/80 p-2.5 sm:p-3 xl:p-3.5 backdrop-blur-xl group-hover/skills:border-[#00C6FE]/40 transition-all duration-300">
                    <div className="relative grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2 max-h-[220px] sm:max-h-[250px] lg:max-h-[235px] xl:max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                      {techItems.map((tech, index) => (
                        <motion.div
                          key={`${tech.name}-${index}`}
                          className="relative group/tech"
                          whileHover={isMobile ? {} : { y: -3 }}
                          transition={{ type: "spring", stiffness: 260, damping: 18 }}
                        >
                          <div
                            className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br ${TECH_CARD_GRADIENTS[index % TECH_CARD_GRADIENTS.length]} opacity-60 blur-xs transition-opacity duration-300 group-hover/tech:opacity-100`}
                          />

                          <div className="relative flex h-full flex-col items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border border-white/10 bg-[rgba(12,19,40,0.85)] px-2 py-2 text-center shadow-md">
                            {tech.icon ? (
                              <motion.img
                                src={tech.icon}
                                alt={`${tech.name} icon`}
                                className="h-6 w-6 sm:h-7 sm:w-7 object-contain drop-shadow-[0_4px_12px_rgba(0,198,254,0.35)]"
                                initial={{ scale: 0.9, opacity: 0.9 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            ) : (
                              <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#00C6FE] to-purple-500 text-[11px] font-black text-white shadow-md">
                                {tech.initials}
                              </span>
                            )}

                            <span className="text-[10px] sm:text-[11px] font-semibold text-white leading-tight truncate max-w-full">
                              {tech.name}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
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
      {/* Timeline Ball - Mathematically centered in the middle of the stick */}
      <div className="absolute top-4 sm:top-5 -left-6 sm:-left-8 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-[#00C6FE] to-purple-500 border-2 border-primary shadow-[0_0_10px_rgba(0,198,254,0.8)] ring-2 ring-[#00C6FE] group-hover:scale-125 transition-transform duration-300 z-10" />

      {/* Glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
      
      <div className="relative backdrop-blur-sm bg-tertiary/50 border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-[#00C6FE]/10 transition-all duration-500">

        {/* Clickable Header */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2.5 sm:gap-4">
            <div className="flex-1">
              {/* Date Badge */}
              <div className="inline-block bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 backdrop-blur-sm border border-[#00C6FE]/30 rounded-full px-2.5 sm:px-3 py-0.5 mb-1 sm:mb-1.5">
                <p className="text-[11px] sm:text-xs font-semibold text-[#00C6FE]">{item.date}</p>
              </div>

              {/* Title with Link */}
              <h3 className="text-white font-bold text-sm sm:text-base lg:text-[17px] mb-0.5 leading-snug">
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
                <p className="text-xs sm:text-sm text-gray-300">
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
                className="flex-shrink-0 mt-1 sm:mt-1.5"
              >
                <svg 
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#00C6FE]" 
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
              <ul className="text-xs sm:text-sm text-secondary mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-white/10 space-y-1.5 sm:space-y-2">
                {item.points.map((point, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start group/item"
                  >
                    <span className="mr-2 text-[#00C6FE] font-bold group-hover/item:scale-125 transition-transform duration-300">•</span>
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
      className="mb-4 sm:mb-6"
    >
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3 sm:mb-4">
        {sectionTitle}
      </h2>
      <div className="relative ml-2 sm:ml-3 pl-6 sm:pl-8 space-y-3 sm:space-y-4">
        {/* Continuous Stick / Timeline Line centered at x=0 */}
        <div className="absolute left-0 top-2 bottom-2 w-1 sm:w-1.5 -translate-x-1/2 bg-gradient-to-b from-[#00C6FE] via-purple-500 to-[#00C6FE] rounded-full shadow-[0_0_10px_rgba(0,198,254,0.6)] pointer-events-none" />
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
  const [education, setEducation] = useState(fallbackEducation);
  const [proexp, setProexp] = useState(fallbackProexp);

  useEffect(() => {
    // Fetch and filter education data
    fetch(`${API_URL}/education`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const enabledEducation = data
            .filter(item => item.enabled)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (enabledEducation.length > 0) {
            setEducation(enabledEducation);
          }
        }
      })
      .catch(() => {
        // Fallback data already loaded
      });

    // Fetch and filter professional experience data
    fetch(`${API_URL}/proexp`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const enabledProexp = data
            .filter(item => item.enabled)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (enabledProexp.length > 0) {
            setProexp(enabledProexp);
          }
        }
      })
      .catch(() => {
        // Fallback data already loaded
      });

    // Listen for tab change events from chat
    const handleTabChange = (event) => {
      const { tab, expand } = event.detail;
      
      if (expand) {
        setShowAll(true);
      }
      
      if (tab === 'education' || tab === 'experience') {
        setActiveTab(tab);
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
        className="relative mb-3 sm:mb-4 lg:mb-4 text-center"
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
          <h2 className="text-white font-black text-2xl xs:text-3xl sm:text-4xl lg:text-4xl xl:text-5xl flex items-center justify-center gap-2 sm:gap-3">
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
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#00C6FE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </motion.div>
          </h2>
          <motion.div
            className="h-1 w-16 sm:w-20 bg-gradient-to-r from-[#00C6FE] to-purple-500 mx-auto mt-2 sm:mt-2.5 rounded-full"
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
        className="relative mb-3.5 sm:mb-5 lg:mb-4"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00C6FE]/5 to-transparent blur-xl" />
        
        <div className="relative flex justify-center gap-2 sm:gap-3 flex-wrap">
          <motion.button
            onClick={() => setActiveTab("experience")}
            whileHover={isMobile ? {} : { scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`relative px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 overflow-hidden shadow-md ${
              activeTab === "experience"
                ? "text-white shadow-[0_0_25px_rgba(0,198,254,0.4)]"
                : "backdrop-blur-sm bg-tertiary/50 border border-white/10 text-gray-400 hover:text-white hover:border-[#00C6FE]/30 hover:shadow-[0_0_15px_rgba(0,198,254,0.2)]"
            }`}
          >
            {activeTab === "experience" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-[#00C6FE] to-purple-500 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Experience
            </span>
          </motion.button>
        
          <motion.button
            onClick={() => setActiveTab("education")}
            whileHover={isMobile ? {} : { scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`relative px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 overflow-hidden shadow-md ${
              activeTab === "education"
                ? "text-white shadow-[0_0_25px_rgba(0,198,254,0.4)]"
                : "backdrop-blur-sm bg-tertiary/50 border border-white/10 text-gray-400 hover:text-white hover:border-[#00C6FE]/30 hover:shadow-[0_0_15px_rgba(0,198,254,0.2)]"
            }`}
          >
            {activeTab === "education" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-[#00C6FE] to-purple-500 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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





