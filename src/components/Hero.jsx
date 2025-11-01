import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
import { Link as ScrollLink } from "react-scroll";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { motion, AnimatePresence } from "framer-motion";

// Premium Social Icon Component
const SocialIcon = ({ icon, href, label }) => (
  <motion.div
    className="relative group"
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.95 }}
  >
    <motion.div
      className="absolute -inset-2 bg-gradient-to-r from-[#00C6FE] to-purple-500 rounded-xl blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-500"
    />
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-2 border-white/20 rounded-xl text-white text-xl transition-all duration-300 group-hover:border-[#00C6FE]/60 group-hover:shadow-[0_0_30px_rgba(0,198,254,0.4)]"
    >
      <FontAwesomeIcon
        icon={icon}
        className="relative z-10 group-hover:scale-110 transition-transform duration-300"
      />
    </a>
  </motion.div>
);

// Animated Role Titles with Modern Design
const AnimatedRoles = () => {
  const roles = [
    { text: "SOFTWARE ENGINEER", color: "from-cyan-400 via-blue-500 to-purple-500" },
    { text: "AI ENTHUSIAST", color: "from-purple-400 via-pink-500 to-red-500" },
    { text: "FULLSTACK DEVELOPER", color: "from-green-400 via-cyan-500 to-blue-500" },
    { text: "OPEN SOURCE CONTRIBUTOR", color: "from-orange-400 via-red-500 to-pink-500" },
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % roles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-16 sm:h-20 flex items-center justify-center w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.8 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="absolute inset-0 flex items-center justify-center px-2 sm:px-4"
        >
          <span className={`text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r ${roles[index].color} bg-clip-text text-transparent drop-shadow-[0_0_50px_rgba(0,198,254,0.5)] whitespace-nowrap text-center leading-tight`}>
            {roles[index].text}
          </span>
        </motion.div>
      </AnimatePresence>
      
      {/* Animated underline */}
      <motion.div
        key={`line-${index}`}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-3/4 max-w-2xl bg-gradient-to-r from-transparent via-[#00C6FE] to-transparent rounded-full"
      />
    </div>
  );
};

// Floating particles background
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 });
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#00C6FE] rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            y: [null, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

const Hero = () => {
  const [cvUrl, setCvUrl] = useState("");
  const [stats, setStats] = useState({ projects: 0, certifications: 0, experiences: 0 });
  const API_URL = import.meta.env.VITE_API_URL;
  
  useEffect(() => {
    // Fetch CV URL
    fetch(`${API_URL}/about`)
      .then((res) => res.json())
      .then((data) => {
        const aboutData = Array.isArray(data) ? data[0] : data;
        if (aboutData?.PDFCV) {
          setCvUrl(aboutData.PDFCV);
        }
      })
      .catch((error) => console.error("Error fetching CV URL:", error));

    // Fetch accurate stats
    Promise.all([
      fetch(`${API_URL}/projects`).then(res => res.json()),
      fetch(`${API_URL}/certifications`).then(res => res.json()),
      fetch(`${API_URL}/proexp`).then(res => res.json())
    ])
      .then(([projectsData, certificationsData, proexpData]) => {
        setStats({
          projects: projectsData.filter(p => p.enabled).length,
          certifications: certificationsData.filter(c => c.enabled).length,
          experiences: proexpData.filter(e => e.enabled).length
        });
      })
      .catch((error) => console.error("Error fetching stats:", error));
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-primary overflow-hidden">
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a3b50] via-primary to-[#0f1f2e]" />
      
      {/* Large gradient orbs */}
      <motion.div
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#00C6FE]/20 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(0,198,254,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,198,254,0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      
      {/* Floating particles */}
      <FloatingParticles />

      {/* Main content container - OPTIMIZED LAYOUT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full h-full min-h-screen flex flex-col"
      >
        {/* Top badges section - Desktop Only */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:flex w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-4 flex-wrap justify-between items-center gap-4"
        >
          {/* Open to Work Badge - Premium Style */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group cursor-pointer"
          >
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-[#00C6FE] to-emerald-400 rounded-2xl blur-md opacity-0 group-hover:opacity-70"
              transition={{ duration: 0.3 }}
            />
            <ScrollLink
              to="contact"
              smooth={true}
              duration={500}
              className="relative flex items-center justify-center gap-2 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-xl border-2 border-[#00C6FE]/30 hover:border-[#00C6FE]/60 transition-all duration-300"
            >
              <motion.div
                className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                animate={{
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    "0_0_10px_rgba(52,211,153,0.8)",
                    "0_0_20px_rgba(52,211,153,1)",
                    "0_0_10px_rgba(52,211,153,0.8)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-white font-bold text-sm tracking-wide">OPEN TO WORK</span>
            </ScrollLink>
          </motion.div>

          {/* Download CV Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-[#00C6FE] to-purple-500 rounded-2xl blur-md opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#00C6FE] to-purple-500 px-6 py-3 rounded-2xl font-bold text-white shadow-xl border-2 border-white/20 hover:shadow-[0_0_30px_rgba(0,198,254,0.5)] transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="tracking-wide">DOWNLOAD CV</span>
            </a>
          </motion.div>
        </motion.div>

        {/* MOBILE LAYOUT - Completely redesigned */}
        <div className="lg:hidden flex-1 w-full flex flex-col items-center justify-center px-5 pt-20 pb-8 space-y-6">
          {/* Top Buttons - Mobile */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md space-y-3"
          >
            {/* Open to Work Badge */}
            <motion.div whileTap={{ scale: 0.95 }} className="relative group">
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-[#00C6FE] to-emerald-400 rounded-2xl blur-md opacity-0 group-active:opacity-70"
                transition={{ duration: 0.3 }}
              />
              <ScrollLink
                to="contact"
                smooth={true}
                duration={500}
                className="relative flex items-center justify-center gap-2 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-xl border-2 border-[#00C6FE]/30 active:border-[#00C6FE]/60 transition-all duration-300 w-full"
              >
                <motion.div
                  className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-white font-bold text-sm tracking-wide">OPEN TO WORK</span>
              </ScrollLink>
            </motion.div>

            {/* Download CV Button */}
            <motion.div whileTap={{ scale: 0.95 }} className="relative group">
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#00C6FE] to-purple-500 px-5 py-3 rounded-2xl font-bold text-white shadow-xl border-2 border-white/20 active:shadow-[0_0_30px_rgba(0,198,254,0.5)] transition-all duration-300 w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="tracking-wide text-sm">DOWNLOAD CV</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Name Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center space-y-3 w-full max-w-md"
          >
            <motion.h1 
              className="text-3xl font-black text-white leading-tight"
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(0,198,254,0.5)",
                  "0 0 40px rgba(0,198,254,0.8)",
                  "0 0 20px rgba(0,198,254,0.5)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Hi, I'm{" "}
              <span className="block bg-gradient-to-r from-[#00C6FE] via-cyan-300 to-purple-500 bg-clip-text text-transparent">
                Tiago Dias
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-gray-300 leading-relaxed px-2"
            >
              Passionate about building{" "}
              <span className="text-[#00C6FE] font-semibold">efficient</span> and{" "}
              <span className="text-purple-400 font-semibold">user-friendly</span>{" "}
              software solutions that make a difference
            </motion.p>
          </motion.div>

          {/* Animated Roles - Mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="relative">
              <motion.div
                className="absolute -inset-4 bg-gradient-to-br from-[#00C6FE]/10 via-purple-500/10 to-transparent rounded-2xl blur-xl"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="relative">
                <AnimatedRoles />
              </div>
            </div>
          </motion.div>

          {/* Stats Cards - Mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-full max-w-md grid grid-cols-3 gap-2.5"
          >
            {[
              { label: 'Projects', value: stats.projects, color: 'from-[#00C6FE] to-cyan-400', hoverBorder: 'active:border-[#00C6FE]/70', scrollTo: 'projects' },
              { label: 'Certifications', value: stats.certifications, color: 'from-purple-500 to-pink-500', hoverBorder: 'active:border-purple-500/70', scrollTo: 'certifications' },
              { label: 'Experiences', value: stats.experiences, color: 'from-orange-400 to-red-500', hoverBorder: 'active:border-orange-400/70', scrollTo: 'about' }
            ].map((stat, i) => (
              <ScrollLink
                key={stat.label}
                to={stat.scrollTo}
                smooth={true}
                duration={500}
                className="cursor-pointer"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  <div className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl border-2 border-white/20 p-3 text-center ${stat.hoverBorder} transition-all duration-300`}>
                    <div className={`text-xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              </ScrollLink>
            ))}
          </motion.div>

          {/* Social Links & About Button - Mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex flex-col items-center gap-4 w-full max-w-md"
          >
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <SocialIcon
                icon={faLinkedin}
                href="https://www.linkedin.com/in/tiagofdias/"
                label="LinkedIn"
              />
              <SocialIcon
                icon={faGithub}
                href="https://github.com/tiagofdias"
                label="GitHub"
              />
            </div>

            {/* About Me Button */}
            <motion.div whileTap={{ scale: 0.95 }} className="w-full">
              <ScrollLink
                to="about"
                smooth={true}
                duration={500}
                className="flex items-center justify-center gap-2 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl font-bold text-white shadow-xl border-2 border-white/20 active:border-[#00C6FE]/60 transition-all duration-300 cursor-pointer w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="tracking-wide text-sm">ABOUT ME</span>
              </ScrollLink>
            </motion.div>
          </motion.div>

          {/* Python Code Elements - Mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="w-full max-w-md space-y-1.5 px-2"
          >
            {['passion = "Building amazing things"', 'impact = float("inf")', 'while learning: grow()'
            ].map((code, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8 + i * 0.1 }}
                className="flex items-center gap-2 text-[10px] font-mono"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00C6FE] shadow-[0_0_10px_rgba(0,198,254,0.8)] flex-shrink-0" />
                <span className="text-gray-400 truncate">{code}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* DESKTOP LAYOUT - TWO COLUMN */}
        <div className="hidden lg:flex flex-1 w-full max-w-[1600px] mx-auto px-12 flex-row items-center justify-between gap-20">
          {/* LEFT SIDE - Main content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 space-y-8 text-left"
          >
            {/* Name and intro */}
            <div className="space-y-6">
              <motion.h1 
                className="text-7xl xl:text-8xl font-black text-white leading-tight"
                animate={{ 
                  textShadow: [
                    "0 0 20px rgba(0,198,254,0.5)",
                    "0 0 40px rgba(0,198,254,0.8)",
                    "0 0 20px rgba(0,198,254,0.5)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Hi, I'm{" "}
                <span className="inline bg-gradient-to-r from-[#00C6FE] via-cyan-300 to-purple-500 bg-clip-text text-transparent">
                  Tiago Dias
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-2xl text-gray-300 leading-relaxed max-w-2xl"
              >
                Passionate about building{" "}
                <span className="text-[#00C6FE] font-semibold">efficient</span> and{" "}
                <span className="text-purple-400 font-semibold">user-friendly</span>{" "}
                software solutions that make a difference
              </motion.p>
            </div>

            {/* Social Links & CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-wrap items-center justify-start gap-4"
            >
              {/* Social Links */}
              <div className="flex items-center gap-3">
                <SocialIcon
                  icon={faLinkedin}
                  href="https://www.linkedin.com/in/tiagofdias/"
                  label="LinkedIn"
                />
                <SocialIcon
                  icon={faGithub}
                  href="https://github.com/tiagofdias"
                  label="GitHub"
                />
              </div>

              <div className="h-8 w-px bg-white/20" />

              {/* About Me Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-[#00C6FE] to-purple-500 rounded-2xl blur-md opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <ScrollLink
                  to="about"
                  smooth={true}
                  duration={500}
                  className="relative flex items-center gap-2 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl px-6 py-3 rounded-2xl font-bold text-white shadow-xl border-2 border-white/20 hover:border-[#00C6FE]/60 transition-all duration-300 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="tracking-wide">ABOUT ME</span>
                </ScrollLink>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE - Premium Animated Role Display */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex-1 flex items-center justify-end"
          >
            <div className="relative w-full max-w-xl px-2 sm:px-0">
              {/* Outer glow ring - hidden on mobile */}
              <motion.div
                className="absolute -inset-8 opacity-50 hidden sm:block"
                animate={{
                  rotate: 360,
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00C6FE] via-purple-500 to-[#00C6FE] rounded-full blur-3xl opacity-30" />
              </motion.div>
              
              {/* Animated role display */}
              <div className="relative">
                {/* Background layers with depth - reduced on mobile */}
                <motion.div
                  className="absolute -inset-3 sm:-inset-6 bg-gradient-to-br from-[#00C6FE]/10 via-purple-500/10 to-transparent rounded-3xl blur-2xl"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                
                {/* Main display area */}
                <div className="relative mb-6 sm:mb-8">
                  <AnimatedRoles />
                </div>
                
                {/* Floating stats/metrics */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3"
                >
                  {[
                    { label: 'Projects', value: stats.projects, color: 'from-[#00C6FE] to-cyan-400', hoverBorder: 'group-hover:border-[#00C6FE]/70', scrollTo: 'projects' },
                    { label: 'Certifications', value: stats.certifications, color: 'from-purple-500 to-pink-500', hoverBorder: 'group-hover:border-purple-500/70', scrollTo: 'certifications' },
                    { label: 'Experiences', value: stats.experiences, color: 'from-orange-400 to-red-500', hoverBorder: 'group-hover:border-orange-400/70', scrollTo: 'about' }
                  ].map((stat, i) => (
                    <ScrollLink
                      key={stat.label}
                      to={stat.scrollTo}
                      smooth={true}
                      duration={500}
                      className="cursor-pointer"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4 + i * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group"
                      >
                        <motion.div
                          className={`absolute -inset-1 bg-gradient-to-r ${stat.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-30`}
                          transition={{ duration: 0.3 }}
                        />
                        <div className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-white/20 p-2 sm:p-4 text-center ${stat.hoverBorder} transition-all duration-300`}>
                          <div className={`text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                            {stat.value}
                          </div>
                          <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-0.5 sm:mt-1 font-medium">
                            {stat.label}
                          </div>
                        </div>
                      </motion.div>
                    </ScrollLink>
                  ))}
                </motion.div>
                
                {/* Decorative code-like elements */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                  className="mt-4 sm:mt-6 space-y-1 sm:space-y-1.5"
                >
                  {['passion = "Building amazing things"', 'impact = float("inf")', 'while learning: grow()'
                  ].map((code, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2 + i * 0.1 }}
                      className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-mono"
                    >
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00C6FE] shadow-[0_0_10px_rgba(0,198,254,0.8)] flex-shrink-0" />
                      <span className="text-gray-400 truncate">{code}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-4 sm:bottom-10 left-1/2 -translate-x-1/2 hidden sm:flex"
        >
          <ScrollLink
            to="projects"
            smooth={true}
            duration={500}
            className="cursor-pointer group"
          >
            <motion.div
              className="flex flex-col items-center gap-2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-gray-400 text-sm font-medium group-hover:text-[#00C6FE] transition-colors">
                Scroll to explore
              </span>
              <div className="w-6 h-10 rounded-full border-2 border-[#00C6FE]/50 group-hover:border-[#00C6FE] flex items-start justify-center p-2 transition-colors">
                <motion.div
                  className="w-1.5 h-1.5 bg-[#00C6FE] rounded-full"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </ScrollLink>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SectionWrapper(Hero, "hero");
