import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { github, webs } from "../assets";
import { scroller } from "react-scroll";

const API_URL = import.meta.env.VITE_API_URL;

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

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  images,
  source_code_link,
  source_code_link2,
  onTagClick,
  activeTag,
  isMobile,
}) => {
  const projectImages = Array.isArray(images) ? images : [images];
  const [previewIndex, setPreviewIndex] = useState(0);
  const extendedImages =
    projectImages.length > 1
      ? [
          projectImages[projectImages.length - 1],
          ...projectImages,
          projectImages[0],
        ]
      : projectImages;
  const [slideIndex, setSlideIndex] = useState(
    projectImages.length > 1 ? 1 : 0
  );
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(null);

  const nextImage = () =>
    setPreviewIndex((prev) => (prev + 1) % projectImages.length);
  const prevImage = () =>
    setPreviewIndex((prev) =>
      prev === 0 ? projectImages.length - 1 : prev - 1
    );

  const nextSlide = () => {
    if (projectImages.length > 1) {
      setTransitionEnabled(true);
      setSlideIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (projectImages.length > 1) {
      setTransitionEnabled(true);
      setSlideIndex((prev) => prev - 1);
    }
  };

  const openPreview = (index) => {
    if (isMobile && projectImages.length > 1) {
      setSlideIndex(index + 1);
    } else {
      setPreviewIndex(index);
    }
    setIsPreviewOpen(true);
  };

  const closePreview = () => setIsPreviewOpen(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    const delta = e.changedTouches[0].screenX - touchStartX.current;
    setSwipeDelta(delta);
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    if (swipeDelta > threshold) {
      prevSlide();
    } else if (swipeDelta < -threshold) {
      nextSlide();
    }
    setIsSwiping(false);
    setSwipeDelta(0);
    touchStartX.current = null;
  };

  const handleTransitionEnd = () => {
    if (slideIndex === 0) {
      setTransitionEnabled(false);
      setSlideIndex(projectImages.length);
    } else if (slideIndex === extendedImages.length - 1) {
      setTransitionEnabled(false);
      setSlideIndex(1);
    }
  };

  useEffect(() => {
    if (!transitionEnabled) {
      requestAnimationFrame(() => setTransitionEnabled(true));
    }
  }, [transitionEnabled]);

  const computedPreviewIndex =
    isMobile && projectImages.length > 1 ? slideIndex - 1 : previewIndex;

  useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closePreview();
      } else if (e.key === "ArrowLeft") {
        if (isMobile && projectImages.length > 1) prevSlide();
        else prevImage();
      } else if (e.key === "ArrowRight") {
        if (isMobile && projectImages.length > 1) nextSlide();
        else nextImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen, slideIndex, previewIndex]);

  return (
    <motion.div
      initial={isMobile ? {} : { opacity: 0, y: 30 }}
      whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={isMobile ? {} : { y: -8 }}
      className="group/card backdrop-blur-md bg-white/5 border border-white/10 hover:border-[#00C6FE]/50 p-5 rounded-2xl sm:w-[360px] w-full flex flex-col shadow-2xl hover:shadow-2xl hover:shadow-[#00C6FE]/20 transition-all duration-300"
      style={{ minHeight: 480 }}
    >
      <div
        className="relative w-full h-[230px] overflow-hidden rounded-xl cursor-pointer"
        onClick={() => openPreview(0)}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-10 rounded-xl" />
        
        {/* Zoom in text overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-20">
          <div className="bg-white/20 backdrop-blur-sm text-white font-bold px-4 py-2 rounded-full flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            View
          </div>
        </div>

        {projectImages.map((image, idx) => (
          <img
            key={idx}
            src={image}
            alt={`project-${idx}`}
            className={`w-full h-full object-cover rounded-xl absolute top-0 left-0 transition-all duration-500 group-hover/card:scale-110 ${
              idx === 0 ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {projectImages.length > 1 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-[#00C6FE] to-purple-500 text-white text-xs font-bold py-1.5 px-3 rounded-full z-20 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            +{projectImages.length - 1}
          </div>
        )}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-sm font-bold"
          style={{ pointerEvents: "none" }}
        >
          Click to Preview
        </div>
      </div>

      <div className="mt-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <h3 className="text-white font-bold text-[22px] pr-4 break-words flex-1 group-hover/card:text-transparent group-hover/card:bg-gradient-to-r group-hover/card:from-[#00C6FE] group-hover/card:to-purple-500 group-hover/card:bg-clip-text transition-all duration-300">
            {(name || "").replace(/-/g, " ")}
          </h3>
          <div className="flex gap-2 ml-2 mt-[-4px]">
            {source_code_link2 && (
              <motion.div
                whileHover={isMobile ? {} : { scale: 1.15, rotate: 5 }}
                whileTap={isMobile ? {} : { scale: 0.95 }}
                className="group/icon w-10 h-10 rounded-full flex justify-center items-center cursor-pointer transition-all duration-300 bg-gradient-to-br from-[#00C6FE]/20 to-purple-500/20 backdrop-blur-sm border border-[#00C6FE]/30 hover:border-[#00C6FE] hover:shadow-lg hover:shadow-[#00C6FE]/30"
                onClick={() => window.open(source_code_link2, "_blank")}
              >
                <img
                  src={webs}
                  alt="website"
                  className="w-1/2 h-1/2 object-contain brightness-0 invert group-hover/icon:scale-110 transition-transform duration-300"
                />
              </motion.div>
            )}
            {source_code_link && (
              <motion.div
                whileHover={isMobile ? {} : { scale: 1.15, rotate: -5 }}
                whileTap={isMobile ? {} : { scale: 0.95 }}
                className="group/icon w-10 h-10 rounded-full flex justify-center items-center cursor-pointer transition-all duration-300 bg-gradient-to-br from-purple-500/20 to-[#00C6FE]/20 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-400/30"
                onClick={() => window.open(source_code_link, "_blank")}
              >
                <img
                  src={github}
                  alt="source code"
                  className="w-1/2 h-1/2 object-contain brightness-0 invert group-hover/icon:scale-110 transition-transform duration-300"
                />
              </motion.div>
            )}
          </div>
        </div>
        <p className="mt-3 text-secondary text-[14px] flex-1 leading-relaxed">{description}</p>
      </div>

      {/* Tags always at the bottom, not absolute */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag, idx) => {
          const isActiveTag =
            activeTag && tag.name.toLowerCase() === activeTag.toLowerCase();
          return (
            <motion.span
              key={`${name}-${idx}`}
              whileHover={isMobile ? {} : { scale: 1.08, y: -2 }}
              whileTap={isMobile ? {} : { scale: 0.95 }}
              className={`text-[13px] px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer backdrop-blur-sm font-medium ${
                isActiveTag 
                  ? "bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 border-[#00C6FE] border shadow-lg shadow-[#00C6FE]/20" 
                  : "bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 border border-[#00C6FE]/30 hover:border-[#00C6FE] hover:shadow-lg hover:shadow-[#00C6FE]/20"
              } text-white`}
              onClick={(e) => {
                e.stopPropagation();
                if (onTagClick) onTagClick(tag.name);
                scroller.scrollTo("projects", {
                  smooth: true,
                  offset: 30,
                  duration: 500,
                });
              }}
            >
              {tag.name}
            </motion.span>
          );
        })}
      </div>

      {isPreviewOpen &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={closePreview}
          >
            {/* Backdrop with blur effect */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`relative rounded-2xl p-6 flex flex-col items-center focus:outline-none w-full shadow-2xl bg-gradient-to-br from-[#1a1a2e]/95 to-[#0f0f1e]/95 border border-white/10 ${
                isMobile ? "max-w-[95vw]" : "max-w-[50vw]"
              }`}
              onClick={(e) => e.stopPropagation()}
              tabIndex={0}
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00C6FE]/5 via-purple-500/5 to-pink-500/5 pointer-events-none rounded-2xl" />
              
              {/* Modern close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 border border-red-500/30 hover:border-red-500/50 shadow-lg"
                onClick={closePreview}
                aria-label="Close preview"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Project title */}
              <h2 className="text-white text-xl font-bold mb-4 mt-2 text-center bg-gradient-to-r from-[#00C6FE] to-purple-500 bg-clip-text text-transparent">
                {(name || "").replace(/-/g, " ")}
              </h2>
              
              {/* Enhanced Image Container */}
              <div className="w-full h-[70vh] flex items-center justify-center relative rounded-xl overflow-hidden">
                {/* Loading shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
                
                {isMobile && projectImages.length > 1 ? (
                  // Mobile infinite carousel with clones
                  <div
                    className="w-full overflow-hidden rounded-xl"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className="flex gap-3 ease-out"
                      style={{
                        transform: `translateX(calc(-${slideIndex} * 100% - ${slideIndex} * 0.75rem + ${swipeDelta}px))`,
                        transition: transitionEnabled
                          ? "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)"
                          : "none",
                      }}
                      onTransitionEnd={handleTransitionEnd}
                    >
                      {extendedImages.map((image, idx) => (
                        <motion.div 
                          key={idx} 
                          className="flex-shrink-0 w-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <img
                            src={image}
                            alt={`Project screenshot ${idx + 1} of ${projectImages.length}`}
                            className="w-full h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Desktop or single image with enhanced styling
                  <motion.img
                    key={previewIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    src={projectImages[previewIndex]}
                    alt={`Project screenshot ${previewIndex + 1} of ${projectImages.length}`}
                    className="max-w-[70vw] max-h-[70vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                  />
                )}
              </div>

              {/* Modern Slideshow Controls */}
              {projectImages.length > 1 && (
                <>
                  {/* Navigation Buttons - Desktop only */}
                  {!isMobile && (
                    <div className="mt-6 flex items-center justify-center gap-4 w-full">
                      <motion.button
                        whileHover={{ scale: 1.05, x: -3 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Previous image"
                        className="group relative px-6 py-3 bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 hover:from-[#00C6FE]/30 hover:to-purple-500/30 text-white rounded-xl focus:outline-none transition-all duration-300 border border-[#00C6FE]/30 hover:border-[#00C6FE]/60 shadow-lg hover:shadow-[#00C6FE]/20 flex items-center gap-2 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, x: 3 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Next image"
                        className="group relative px-6 py-3 bg-gradient-to-r from-purple-500/20 to-[#00C6FE]/20 hover:from-purple-500/30 hover:to-[#00C6FE]/30 text-white rounded-xl focus:outline-none transition-all duration-300 border border-purple-500/30 hover:border-purple-500/60 shadow-lg hover:shadow-purple-500/20 flex items-center gap-2 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                      >
                        Next
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    </div>
                  )}
                  
                  {/* Enhanced Dot Indicators */}
                  <div className="mt-6 flex justify-center items-center gap-2">
                    {projectImages.map((_, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Go to image ${idx + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMobile && projectImages.length > 1) {
                            setSlideIndex(idx + 1);
                          } else {
                            setPreviewIndex(idx);
                          }
                        }}
                        className={`rounded-full focus:outline-none transition-all duration-300 ${
                          computedPreviewIndex === idx
                            ? "w-8 h-3 bg-gradient-to-r from-[#00C6FE] to-purple-500 shadow-lg shadow-[#00C6FE]/30"
                            : "w-3 h-3 bg-white/30 hover:bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Image counter */}
                  <div className="mt-3 text-center text-white/60 text-sm font-medium">
                    {computedPreviewIndex + 1} / {projectImages.length}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>,
          document.body
        )}
    </motion.div>
  );
};

const Projects = () => {
  const isMobile = useIsMobile();
  const [showAll, setShowAll] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Fetch projects from backend API and filter enabled ones
    fetch(`${API_URL}/projects`)
      .then((res) => res.json())
      .then((data) => {
        // Filter enabled projects and sort by order
        const enabledProjects = data
          .filter((project) => project.enabled)
          .sort((a, b) => a.order - b.order);
        setProjects(enabledProjects);
      })
      .catch((err) => console.error("Failed to fetch projects:", err));
  }, []);

  // Listen for filter events from ChatWidget
  useEffect(() => {
    const handleFilterProjects = (event) => {
      console.log('Projects component received filter event:', event.detail);
      const { tag } = event.detail;
      
      if (tag === 'clear') {
        console.log('Clearing all filters');
        setActiveTag(null);
        setShowAll(true);
      } else {
        console.log('Setting active tag to:', tag);
        setActiveTag(tag);
        setShowAll(true);
      }
    };

    window.addEventListener("filterProjects", handleFilterProjects);
    console.log('Projects component listening for filterProjects events');
    return () => {
      window.removeEventListener("filterProjects", handleFilterProjects);
      console.log('Projects component stopped listening for filterProjects events');
    };
  }, []);

  const filteredProjects = activeTag
    ? projects.filter((p) => {
        const hasTag = p.tags.some((t) => t.name.toLowerCase() === activeTag.toLowerCase());
        if (hasTag) console.log('Project matches tag:', p.name);
        return hasTag;
      })
    : projects;

  console.log('Active tag:', activeTag);
  console.log('Filtered projects count:', filteredProjects.length);
  console.log('Show all:', showAll);

  const projectsToDisplay = activeTag
    ? filteredProjects
    : showAll
    ? filteredProjects
    : filteredProjects.slice(0, 3);
  
  console.log('Projects to display:', projectsToDisplay.length);

  return (
    <div className="relative">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#00C6FE]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
      </div>

      {/* Header */}
      <motion.div
        initial={isMobile ? {} : { opacity: 0, y: -20 }}
        whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-white font-black text-4xl sm:text-5xl md:text-6xl">
          My{" "}
          <span className="bg-gradient-to-r from-[#00C6FE] to-purple-500 bg-clip-text text-transparent">
            Projects
          </span>
        </h2>
        <motion.div
          initial={isMobile ? {} : { scaleX: 0 }}
          whileInView={isMobile ? {} : { scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-1 w-24 bg-gradient-to-r from-[#00C6FE] to-purple-500 mx-auto mt-4 rounded-full"
        />
        <motion.p
          initial={isMobile ? {} : { opacity: 0 }}
          whileInView={isMobile ? {} : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-secondary text-[17px] max-w-3xl mx-auto leading-[30px]"
        >
          Explore my portfolio of innovative projects showcasing modern web technologies 🚀
        </motion.p>
      </motion.div>

      {/* Active Tag Filter Badge */}
      {activeTag && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-6"
        >
          <div className="backdrop-blur-md bg-white/10 border border-[#00C6FE]/50 rounded-full px-6 py-3 flex items-center gap-3">
            <span className="text-white font-semibold">Filtering by:</span>
            <span className="bg-gradient-to-r from-[#00C6FE] to-purple-500 bg-clip-text text-transparent font-bold">
              {activeTag}
            </span>
            <button
              onClick={() => setActiveTag(null)}
              className="ml-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
            >
              <span className="text-white text-sm">✕</span>
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-12 flex flex-wrap gap-7 justify-center">
        {projectsToDisplay.map((project, index) => (
          <ProjectCard
            key={`project-${index}`}
            index={index}
            activeTag={activeTag}
            onTagClick={(tagName) => {
              setActiveTag((prev) =>
                prev && prev.toLowerCase() === tagName.toLowerCase()
                  ? null
                  : tagName
              );
              setShowAll(true);
            }}
            isMobile={isMobile}
            {...project}
          />
        ))}
      </div>

      {!activeTag && !showAll && (
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
              View All Projects
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default SectionWrapper(Projects, "projects");
