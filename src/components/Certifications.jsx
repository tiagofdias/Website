import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { styles } from "../styles";
import { webs, github } from "../assets";
import { SectionWrapper } from "../hoc";

const API_URL = import.meta.env.VITE_API_URL;

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

  return (
    <div className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full relative">
      {/* Image Preview Container */}
      <div
        className="relative w-full h-[230px] overflow-hidden group cursor-pointer"
        onClick={() => openPreview(0)}
      >
        {projectImages.map((image, idx) => (
          <img
            key={idx}
            src={image}
            alt={`project-${idx}`}
            className={`w-full h-full object-cover rounded-2xl absolute top-0 left-0 transition-opacity duration-500 ${
              previewIndex === idx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {projectImages.length > 1 && (
          <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-xs py-1 px-2 rounded">
            +{projectImages.length - 1} More
          </div>
        )}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-sm font-bold"
          style={{ pointerEvents: "none" }}
        >
          Click to Preview
        </div>
      </div>

      {/* Project Details */}
      <div className="mt-5">
        <h3 className="text-white font-bold text-[24px] break-words pr-20">
          {name}
        </h3>
        <p className="mt-2 text-secondary text-[14px]">{description}</p>
      </div>

      {/* Tags Section */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <a
            key={`${name}-${idx}`}
            href={tag.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              text-[14px] px-2.5 py-1 rounded-full transition-all duration-300 transform
              text-white hover:scale-105
            `}
            style={{
              background: tag.color || "#2563eb",
            }}
          >
            {tag.name}
          </a>
        ))}
      </div>

      {/* Links Button */}
      <div className="absolute right-6 flex z-50" style={{ top: "262px" }}>
        {source_code_link2 && (
          <div
            className="relative w-11 h-11 left-3 rounded-full flex justify-center items-center cursor-pointer transition-transform duration-300 hover:scale-110"
            onClick={() => window.open(source_code_link2, "_blank")}
          >
            <img
              src={webs}
              alt="website"
              className="w-1/2 h-1/2 object-contain"
            />
          </div>
        )}
        {source_code_link && (
          <div
            className="relative w-11 h-11 rounded-full flex justify-center items-center cursor-pointer transition-transform duration-300 hover:scale-110"
            onClick={() => window.open(source_code_link, "_blank")}
          >
            <img
              src={github}
              alt="source code"
              className="w-1/2 h-1/2 object-contain"
            />
          </div>
        )}
      </div>

      {/* Updated Preview Modal using React Portal */}
      {isPreviewOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 bg-tertiary bg-opacity-100 flex items-center justify-center z-50"
            onClick={closePreview}
          >
            <div
              className={`relative rounded-lg p-6 flex flex-col items-center focus:outline-none w-full ${
                isMobile ? "max-w-[90vw]" : "max-w-[44vw]"
              }`}
              onClick={(e) => e.stopPropagation()}
              tabIndex={0}
            >
              {/* X Button to close */}
              <button
                className="absolute top-1 right-1 text-white text-4xl font-bold focus:outline-none transform transition-all duration-200 hover:text-red-600"
                onClick={closePreview}
              >
                &times;
              </button>
              <br></br>
              {/* Image Container */}
              <div className="w-full h-[70vh] flex items-center justify-center">
                {isMobile && projectImages.length > 1 ? (
                  // Mobile infinite carousel with clones
                  <div
                    className="w-full overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className="flex gap-2 ease-out"
                      style={{
                        transform: `translateX(calc(-${slideIndex} * 100% - ${slideIndex} * 0.5rem + ${swipeDelta}px))`,
                        transition: transitionEnabled
                          ? "transform 300ms ease-out"
                          : "none",
                      }}
                      onTransitionEnd={handleTransitionEnd}
                    >
                      {extendedImages.map((image, idx) => (
                        <div key={idx} className="flex-shrink-0 w-full">
                          <img
                            src={image}
                            alt={`Image ${idx + 1} of ${projectImages.length}`}
                            className="w-full h-auto object-contain rounded-lg transition-opacity duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Non-mobile or single image
                  <img
                    src={projectImages[previewIndex]}
                    alt={`Image ${previewIndex + 1} of ${projectImages.length}`}
                    className="max-w-[70vw] max-h-[70vh] object-contain rounded-lg transition-opacity duration-500"
                  />
                )}
              </div>

              {/* Slideshow Controls */}
              {projectImages.length > 1 && (
                <>
                  {/* Web Navigation Buttons */}
                  {!isMobile && (
                    <div className="mt-4 flex items-center justify-between w-full">
                      <button
                        aria-label="Previous image"
                        className="px-4 py-2 bg-white text-black rounded focus:outline-none w-32"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        Previous
                      </button>
                      <button
                        aria-label="Next image"
                        className="px-4 py-2 bg-white text-black rounded focus:outline-none w-32"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                  {/* Dot Indicators for both mobile & web */}
                  <div className="mt-4 flex justify-center space-x-2">
                    {projectImages.map((_, idx) => (
                      <button
                        key={idx}
                        aria-label={`Go to image ${idx + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMobile && projectImages.length > 1) {
                            setSlideIndex(idx + 1);
                          } else {
                            setPreviewIndex(idx);
                          }
                        }}
                        className={`w-3 h-3 rounded-full focus:outline-none ${
                          computedPreviewIndex === idx
                            ? "bg-white"
                            : "bg-gray-600"
                        }`}
                      ></button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

const Certifications = () => {
  const [certifications, setCertifications] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/certifications`)
      .then((res) => res.json())
      .then((data) => setCertifications(data))
      .catch((err) => console.error("Failed to fetch certifications:", err));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const certificationsToDisplay = showAll
    ? certifications
    : certifications.slice(0, 3);

  return (
    <>
      <div>
        <h2 className={`${styles.sectionHeadText}`}>Certifications.</h2>
      </div>

      <div className="w-full flex">
        <p className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]">
          Things I've earned.
        </p>
      </div>

      <div className="mt-20 flex flex-wrap gap-7 justify-center">
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
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setShowAll(true)}
            className="bg-tertiary transition-transform duration-300 transform hover:scale-110 hover:bg-[#00C6FE] outline-none shadow-md shadow-primary text-white font-bold py-2 w-[1000px] rounded-3xl"
          >
            View All
          </button>
        </div>
      )}
    </>
  );
};

export default SectionWrapper(Certifications, "certifications");
