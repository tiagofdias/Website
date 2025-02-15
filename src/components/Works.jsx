import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { github, webs } from "../assets";
import { scroller } from "react-scroll";

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
  isMobile, // Added isMobile prop
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(null);

  const projectImages = Array.isArray(images) ? images : [images];

  // Image navigation functions
  const nextImage = () =>
    setPreviewIndex((prev) => (prev + 1) % projectImages.length);
  const prevImage = () =>
    setPreviewIndex((prev) =>
      prev === 0 ? projectImages.length - 1 : prev - 1
    );

  // Preview modal controls
  const openPreview = (index) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const closePreview = () => setIsPreviewOpen(false);

  // Swipe handlers for mobile
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
    if (swipeDelta > threshold) prevImage();
    else if (swipeDelta < -threshold) nextImage();
    setIsSwiping(false);
    setSwipeDelta(0);
    touchStartX.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closePreview();
      else if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen]);

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
              currentIndex === idx ? "opacity-100" : "opacity-0"
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
        <h3 className="text-white font-bold text-[20px] pr-16 break-words">
          {name}
        </h3>
        <p className="mt-2 text-secondary text-[14px]">{description}</p>
      </div>

      {/* Tags Section */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag, idx) => {
          const isActiveTag =
            activeTag && tag.name.toLowerCase() === activeTag.toLowerCase();
          return (
            <span
              key={`${name}-${idx}`}
              className={`text-[14px] px-2.5 py-1 rounded-full transition-all duration-300 transform cursor-pointer ${
                isActiveTag ? "bg-[#00C6FE]" : "bg-gray-700"
              } text-white hover:scale-105`}
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
            </span>
          );
        })}
      </div>

      {/* Link Buttons */}
      <div className="absolute right-2 flex" style={{ top: "262px" }}>
        {source_code_link2 && (
          <div
            className="relative w-11 h-11 left-3 rounded-full flex justify-center items-center cursor-pointer transition-transform duration-300 hover:scale-110"
            onClick={() => {
              if (index === 0) {
                if (
                  !window.confirm(
                    "This website may take 1-2 minutes to load due to free hosting. Continue?"
                  )
                )
                  return;
              }
              window.open(source_code_link2, "_blank");
            }}
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

      {/* Enhanced Preview Modal */}
      {isPreviewOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
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
              {/* Image Container with fixed height */}
              <div className="w-full h-[70vh] flex items-center justify-center">
                {isMobile ? (
                  <div
                    className="w-full overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className="flex transition-transform duration-300 ease-out gap-2"
                      style={{
                        transform: `translateX(calc(-${previewIndex} * 100% - ${previewIndex} * 0.5rem + ${swipeDelta}px))`,
                      }}
                    >
                      {projectImages.map((image, idx) => (
                        <div key={idx} className="flex-shrink-0 w-full">
                          <img
                            src={image}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-auto object-contain rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <img
                    src={projectImages[previewIndex]}
                    alt={`Image ${previewIndex + 1}`}
                    className="max-w-[70vw] max-h-[70vh] object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Navigation Controls */}
              {projectImages.length > 1 && (
                <>
                  {!isMobile && (
                    <div className="mt-4 flex items-center justify-between w-full">
                      <button
                        className="px-4 py-2 bg-white text-black rounded w-32"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        Previous
                      </button>
                      <button
                        className="px-4 py-2 bg-white text-black rounded w-32"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                  <div className="mt-4 flex justify-center space-x-2">
                    {projectImages.map((_, idx) => (
                      <button
                        key={idx}
                        className={`w-3 h-3 rounded-full ${
                          previewIndex === idx ? "bg-white" : "bg-gray-600"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewIndex(idx);
                        }}
                      />
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

const Projects = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredProjects = activeTag
    ? projects.filter((p) =>
        p.tags.some(
          (t) => t.name.toLowerCase() === activeTag.toLowerCase()
        )
      )
    : projects;

  const projectsToDisplay = activeTag
    ? filteredProjects
    : showAll
    ? filteredProjects
    : filteredProjects.slice(0, 3);

  return (
    <>
      <div>
        <h2 className={`${styles.sectionHeadText}`}>Projects</h2>
      </div>
      <div className="w-full flex">
        <p className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]">
          Check out some of my dope projects.
        </p>
      </div>

      {activeTag && (
        <div className="mt-4 flex items-center">
          <span className="text-secondary mr-4">
            Filtering by tag:{" "}
            <strong className="capitalize text-white">{activeTag}</strong>
          </span>
          <button
            className="bg-gray-700 hover:scale-110 text-white px-3 py-1 rounded hover:bg-gray-600 transition-transform duration-300"
            onClick={() => setActiveTag(null)}
          >
            Clear Filter
          </button>
        </div>
      )}

      <div className="mt-20 flex flex-wrap gap-7 justify-center">
        {projectsToDisplay.map((project, index) => (
          <ProjectCard
            key={`project-${index}`}
            index={index}
            activeTag={activeTag}
            onTagClick={(tagName) => {
              setActiveTag(tagName);
              setShowAll(true);
            }}
            isMobile={isMobile}
            {...project}
          />
        ))}
      </div>

      {!activeTag && !showAll && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setShowAll(true)}
            className="bg-tertiary hover:scale-110 hover:bg-[#00C6FE] text-white font-bold py-2 w-[1000px] rounded-3xl transition-transform duration-300 outline-none shadow-md shadow-primary"
          >
            View All
          </button>
        </div>
      )}
    </>
  );
};

export default SectionWrapper(Projects, "projects");


