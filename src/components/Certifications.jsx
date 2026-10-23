import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { styles } from "../styles";
import { webs, github } from "../assets";
import { SectionWrapper } from "../hoc";
import useIsMobile from "../utils/useIsMobile";
import { fallbackCertifications } from "../data/fallbackData";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  images,
  source_code_link,
  source_code_link2,
  isMobile,
}) => {
  // For web (non-mobile) mode
  const [previewIndex, setPreviewIndex] = useState(0);

  // For mobile infinite-loop carousel
  const projectImages = Array.isArray(images) ? images : [images];
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

  // Standard web handlers
  const nextImage = () => {
    setPreviewIndex((prev) => (prev + 1) % projectImages.length);
  };

  const prevImage = () => {
    setPreviewIndex((prev) =>
      prev === 0 ? projectImages.length - 1 : prev - 1
    );
  };

  // Mobile infinite loop handlers
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
    // For mobile, we want to start on the real image inside the extended array.
    if (isMobile && projectImages.length > 1) {
      setSlideIndex(index + 1);
    } else {
      setPreviewIndex(index);
    }
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  // Touch handling for swipe (mobile)
  const touchStartX = useRef(null);
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

  // Snap the slider if we're on a clone (mobile infinite loop)
  const handleTransitionEnd = () => {
    if (slideIndex === 0) {
      setTransitionEnabled(false);
      setSlideIndex(projectImages.length);
    } else if (slideIndex === extendedImages.length - 1) {
      setTransitionEnabled(false);
      setSlideIndex(1);
    }
  };

  // Re-enable transition after snapping
  useEffect(() => {
    if (!transitionEnabled) {
      requestAnimationFrame(() => setTransitionEnabled(true));
    }
  }, [transitionEnabled]);

  // computedPreviewIndex for dot indicators (works for both mobile & web)
  const computedPreviewIndex =
    isMobile && projectImages.length > 1 ? slideIndex - 1 : previewIndex;

  // Keyboard navigation
  useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closePreview();
      } else if (e.key === "ArrowLeft") {
        isMobile && projectImages.length > 1 ? prevSlide() : prevImage();
      } else if (e.key === "ArrowRight") {
        isMobile && projectImages.length > 1 ? nextSlide() : nextImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen, slideIndex, previewIndex]);

  // Auto-cycle images on card preview
  const [isHovering, setIsHovering] = useState(false);
  useEffect(() => {
    if (!isHovering || projectImages.length <= 1 || isPreviewOpen) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % projectImages.length);
    }, 2000); // Change image every 2 seconds
    return () => clearInterval(interval);
  }, [isHovering, projectImages.length, isPreviewOpen]);

  return (
    <motion.div
      initial={isMobile ? {} : { opacity: 0, y: 30 }}
      whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={isMobile ? {} : { y: -6 }}
      className="group/card backdrop-blur-md bg-white/5 border border-white/10 hover:border-[#00C6FE]/50 p-3.5 sm:p-4 lg:p-3.5 xl:p-5 rounded-2xl w-full sm:w-[320px] md:w-[340px] lg:w-[315px] xl:w-[360px] max-w-full flex flex-col shadow-2xl hover:shadow-2xl hover:shadow-[#00C6FE]/20 transition-all duration-300 min-h-[350px] sm:min-h-[390px] lg:min-h-[370px] xl:min-h-[440px]"
    >
      {/* Image Preview Container */}
      <div
        className="relative w-full h-[135px] xs:h-[150px] sm:h-[165px] lg:h-[140px] xl:h-[185px] overflow-hidden rounded-xl cursor-pointer"
        onClick={() => openPreview(0)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setPreviewIndex(0); // Reset to first image when not hovering
        }}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-10 rounded-xl" />
        
        {/* View overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-20">
          <div className="bg-white/20 backdrop-blur-sm text-white font-bold px-3 py-1 rounded-full flex items-center gap-1.5 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Certificate
          </div>
        </div>

        {projectImages.map((image, idx) => (
          <img
            key={idx}
            src={image}
            alt={`certification-${idx}`}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover rounded-xl absolute top-0 left-0 transition-all duration-500 group-hover/card:scale-110 ${
              previewIndex === idx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {projectImages.length > 1 && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-[#00C6FE] to-purple-500 text-white text-[9px] sm:text-[10px] font-bold py-0.5 px-2 rounded-full z-20 flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            +{projectImages.length - 1}
          </div>
        )}
      </div>

      {/* Certification Details with action buttons on the right of the title */}
      <div className="mt-2.5 sm:mt-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <h3 
            className="text-white font-bold text-sm xs:text-base sm:text-lg lg:text-[17px] xl:text-[20px] break-words pr-2 flex-1 group-hover/card:text-transparent group-hover/card:bg-gradient-to-r group-hover/card:from-[#00C6FE] group-hover/card:to-purple-500 group-hover/card:bg-clip-text transition-all duration-300 cursor-pointer leading-snug"
            onClick={() => openPreview(0)}
          >
            {name}
          </h3>
          <div className="flex gap-1.5 ml-2 mt-[-1px] flex-shrink-0">
            {source_code_link2 && (
              <motion.div
                whileHover={isMobile ? {} : { scale: 1.15, rotate: 5 }}
                whileTap={isMobile ? {} : { scale: 0.95 }}
                className="group/icon w-7 h-7 sm:w-8 sm:h-8 rounded-full flex justify-center items-center cursor-pointer transition-all duration-300 bg-gradient-to-br from-[#00C6FE]/20 to-purple-500/20 backdrop-blur-sm border border-[#00C6FE]/30 hover:border-[#00C6FE] hover:shadow-lg hover:shadow-[#00C6FE]/30"
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
                className="group/icon w-7 h-7 sm:w-8 sm:h-8 rounded-full flex justify-center items-center cursor-pointer transition-all duration-300 bg-gradient-to-br from-purple-500/20 to-[#00C6FE]/20 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-400/30"
                onClick={() => window.open(source_code_link, "_blank")}
              >
                <img
                  src={github}
                  alt="verification"
                  className="w-1/2 h-1/2 object-contain brightness-0 invert group-hover/icon:scale-110 transition-transform duration-300"
                />
              </motion.div>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-secondary text-xs sm:text-[13px] flex-1 leading-relaxed line-clamp-2">{description}</p>
      </div>

      {/* Tags always at the bottom, not absolute */}
      <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
        {tags.map((tag, idx) => (
          <motion.a
            key={`${name}-${idx}`}
            href={tag.link}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={isMobile ? {} : { scale: 1.08, y: -2 }}
            whileTap={isMobile ? {} : { scale: 0.95 }}
            className="text-[9px] xs:text-[10px] sm:text-[11px] px-2.5 py-0.5 sm:py-1 rounded-full transition-all duration-300 text-white bg-gradient-to-r from-[#00C6FE]/20 to-purple-500/20 backdrop-blur-sm border border-[#00C6FE]/30 hover:border-[#00C6FE] hover:shadow-md hover:shadow-[#00C6FE]/20 font-medium"
          >
            {tag.name}
          </motion.a>
        ))}
      </div>

      {/* Modern Preview Modal using React Portal */}
      {isPreviewOpen &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto custom-scrollbar"
            onClick={closePreview}
          >
            {/* Backdrop with blur effect */}
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl" />
            
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative my-auto w-full max-w-[96vw] sm:max-w-[90vw] md:max-w-4xl xl:max-w-5xl max-h-[92vh] flex flex-col rounded-2xl p-3 sm:p-5 md:p-6 shadow-2xl bg-gradient-to-br from-[#1a1a2e]/98 to-[#0f0f1e]/98 border border-white/10 focus:outline-none overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              tabIndex={0}
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00C6FE]/5 via-purple-500/5 to-pink-500/5 pointer-events-none rounded-2xl" />
              
              {/* Modern close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 border border-red-500/30 hover:border-red-500/50 shadow-lg cursor-pointer"
                onClick={closePreview}
                aria-label="Close preview"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Certificate title */}
              <h2 id="modal-title" className="text-white text-sm sm:text-base md:text-xl font-bold mb-2 sm:mb-3 mt-0 sm:mt-1 text-center px-10 max-w-full truncate bg-gradient-to-r from-[#00C6FE] to-purple-500 bg-clip-text text-transparent flex-shrink-0">
                {name}
              </h2>
              
              {/* Enhanced Responsive Image Container */}
              <div className="relative w-full flex-1 min-h-0 max-h-[50vh] sm:max-h-[56vh] md:max-h-[62vh] xl:max-h-[68vh] flex items-center justify-center rounded-xl overflow-hidden bg-black/40">
                {/* Loading shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
                
                {/* Floating Navigation Arrows - Desktop only */}
                {projectImages.length > 1 && !isMobile && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Previous image"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 hover:border-[#00C6FE] transition-all duration-200 shadow-xl cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                    >
                      <svg className="w-5 h-5 -translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Next image"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 hover:border-[#00C6FE] transition-all duration-200 shadow-xl cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                    >
                      <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </>
                )}

                {isMobile && projectImages.length > 1 ? (
                  // Mobile infinite carousel with swipe
                  <div
                    className="w-full h-full max-h-[50vh] sm:max-h-[56vh] md:max-h-[62vh] overflow-hidden rounded-xl flex items-center"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className="flex gap-3 ease-out items-center w-full"
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
                          className="flex-shrink-0 w-full flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <img
                            src={image}
                            alt={`Certificate ${idx + 1} of ${projectImages.length}`}
                            className="w-full h-auto max-h-[50vh] sm:max-h-[56vh] md:max-h-[62vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Desktop or single image with responsive containment
                  <motion.img
                    key={previewIndex}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    src={projectImages[previewIndex]}
                    alt={`Certificate ${previewIndex + 1} of ${projectImages.length}`}
                    className="w-auto h-auto max-w-full max-h-[50vh] sm:max-h-[56vh] md:max-h-[62vh] xl:max-h-[68vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                  />
                )}
              </div>

              {/* Modern Compact Slideshow Controls */}
              {projectImages.length > 1 && (
                <div className="mt-2.5 sm:mt-3.5 flex items-center justify-center gap-3 sm:gap-4 flex-shrink-0 w-full">
                  {/* Prev Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Previous image"
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#00C6FE]/15 to-purple-500/15 hover:from-[#00C6FE]/30 hover:to-purple-500/30 text-white text-xs sm:text-sm font-medium rounded-xl border border-white/10 hover:border-[#00C6FE]/50 transition-all flex items-center gap-1.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMobile) prevSlide();
                      else prevImage();
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Prev</span>
                  </motion.button>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
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
                        className={`rounded-full transition-all duration-300 cursor-pointer ${
                          computedPreviewIndex === idx
                            ? "w-6 sm:w-7 h-2 sm:h-2.5 bg-gradient-to-r from-[#00C6FE] to-purple-500 shadow-md shadow-[#00C6FE]/40"
                            : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/30 hover:bg-white/60"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Counter */}
                  <span className="text-white/70 text-xs sm:text-sm font-semibold tracking-wider">
                    {computedPreviewIndex + 1} / {projectImages.length}
                  </span>

                  {/* Next Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Next image"
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-500/15 to-[#00C6FE]/15 hover:from-purple-500/30 hover:to-[#00C6FE]/30 text-white text-xs sm:text-sm font-medium rounded-xl border border-white/10 hover:border-purple-400/50 transition-all flex items-center gap-1.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMobile) nextSlide();
                      else nextImage();
                    }}
                  >
                    <span>Next</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>,
          document.body
        )}
    </motion.div>
  );
};

const Certifications = () => {
  const isMobile = useIsMobile();
  const [certifications, setCertifications] = useState(fallbackCertifications);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/certifications`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const enabledCertifications = data
            .filter((cert) => cert.enabled)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (enabledCertifications.length > 0) {
            setCertifications(enabledCertifications);
          }
        }
      })
      .catch(() => {
        // Fallback data already loaded
      });
  }, []);

  const certificationsToDisplay = showAll
    ? certifications
    : certifications.slice(0, 3);

  return (
    <div className="relative">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#00C6FE]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 80, 0],
            y: [0, -60, 0],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Header */}
      <motion.div
        initial={isMobile ? {} : { opacity: 0, y: -20 }}
        whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-3.5 sm:mb-5 lg:mb-4 xl:mb-6"
      >
        <p className={`${styles.sectionSubText} text-purple-400`}>Achievements</p>
        <h2 className="text-white font-black text-2xl xs:text-3xl sm:text-4xl lg:text-4xl xl:text-5xl mt-1">
          <span className="bg-gradient-to-r from-[#00C6FE] to-purple-500 bg-clip-text text-transparent">
            Certifications
          </span>
        </h2>
        <motion.div
          initial={isMobile ? {} : { scaleX: 0 }}
          whileInView={isMobile ? {} : { scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-1 w-16 sm:w-20 bg-gradient-to-r from-[#00C6FE] to-purple-500 mx-auto mt-2 sm:mt-2.5 rounded-full"
        />
        <motion.p
          initial={isMobile ? {} : { opacity: 0 }}
          whileInView={isMobile ? {} : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-2 text-secondary text-xs sm:text-sm lg:text-base max-w-2xl mx-auto leading-relaxed px-2"
        >
          Professional certifications and achievements that validate my expertise.
        </motion.p>
      </motion.div>

      <div className="mt-3 sm:mt-5 lg:mt-4 xl:mt-6 flex flex-wrap gap-3.5 sm:gap-5 lg:gap-4 xl:gap-7 justify-center w-full">
        {certificationsToDisplay.map((certification, index) => (
          <ProjectCard
            key={`certification-${index}`}
            index={index}
            {...certification}
            showSecondLink={certification.name !== "Condomix"}
            isMobile={isMobile}
          />
        ))}
      </div>

      {!showAll && certifications.length > 3 && (
        <motion.div 
          className="flex justify-center mt-3 sm:mt-5 lg:mt-4 xl:mt-6"
          initial={isMobile ? {} : { opacity: 0, y: 20 }}
          whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.button
            onClick={() => setShowAll(true)}
            whileHover={isMobile ? {} : { scale: 1.05, x: 5 }}
            whileTap={isMobile ? {} : { scale: 0.95 }}
            className="group relative bg-gradient-to-r from-[#00C6FE] to-purple-500 hover:from-[#00C6FE]/90 hover:to-purple-500/90 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-[#00C6FE]/30 outline-none text-white font-bold py-2.5 sm:py-3 lg:py-2.5 xl:py-3.5 px-6 sm:px-8 xl:px-10 text-xs sm:text-sm rounded-full overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            
            <span className="relative flex items-center gap-2">
              View All Certifications
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default SectionWrapper(Certifications, "certifications");
