import React, { useState, useEffect } from "react";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { github, webs } from "../assets";
import { scroller } from "react-scroll"; // Import scroller for programmatic scrolling

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
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const projectImages = Array.isArray(images) ? images : [images];

  const nextImage = () => {
    setPreviewIndex((prev) => (prev + 1) % projectImages.length);
  };

  const prevImage = () => {
    setPreviewIndex((prev) =>
      prev === 0 ? projectImages.length - 1 : prev - 1
    );
  };

  const openPreview = (index) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  // These states are local to ProjectCard; remove them if not needed.
  const [active, setActive] = useState("");
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full relative">
      {/* Project Image Preview */}
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
          // If the activeTag matches the current tag (case-insensitive), apply cyan background.
          const isActiveTag =
            activeTag && tag.name.toLowerCase() === activeTag.toLowerCase();
          return (
            <span
              key={`${name}-${idx}`}
              className={`text-[14px] px-2.5 py-1 rounded-full transition-all duration-300 transform cursor-pointer 
              ${
                isActiveTag ? "bg-[#00C6FE]" : "bg-gray-700"
              } text-white hover:scale-105`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click propagation
                if (onTagClick) onTagClick(tag.name);
                // Programmatically scroll to the "projects" section
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
                const userConfirmed = window.confirm(
                  "This website may take some time (1-2 minutes) to load due to the free hosting service. Do you want to continue?"
                );
                if (!userConfirmed) return;
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

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
          onClick={closePreview}
        >
          <div
            className="relative bg-white rounded-lg p-4 w-[70vw] h-[70vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={projectImages[previewIndex]}
              alt={`Preview-${previewIndex}`}
              className="max-w-full max-h-full object-contain rounded-lg transition-opacity duration-500"
            />

            {projectImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black text-white p-2 rounded-full hover:bg-opacity-70"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                >
                  ◀
                </button>
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black text-white p-2 rounded-full hover:bg-opacity-70"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                >
                  ▶
                </button>
              </>
            )}

            <button
              className="absolute top-3 right-3 text-white text-2xl bg-black p-2 rounded-full hover:bg-gray-800"
              onClick={closePreview}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Projects = () => {
  const [isMobile, setIsMobile] = useState(false);
  // State to control whether to show all projects or just a subset
  const [showAll, setShowAll] = useState(false);
  // State for the active tag filter
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter projects if an active tag is set
  const filteredProjects = activeTag
    ? projects.filter((project) =>
        project.tags.some(
          (tag) => tag.name.toLowerCase() === activeTag.toLowerCase()
        )
      )
    : projects;

  // Decide how many projects to display
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

      {/* Display active filter and a clear button */}
      {activeTag && (
        <div className="mt-4 flex items-center">
          <span className="text-secondary mr-4">
            Filtering by tag: {" "}
            <strong className="capitalize text-white">{activeTag}</strong>
          </span>

          <button
            className="bg-gray-700 transition-transform duration-300 transform hover:scale-110 text-white px-3 py-1 rounded hover:bg-gray-600"
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
            activeTag={activeTag} // Pass the active tag to each project card
            onTagClick={(tagName) => {
              setActiveTag(tagName);
              setShowAll(true);
            }}
            {...project}
          />
        ))}
      </div>

      {/* "View All" button appears only when no tag is active and not all projects are shown */}
      {!activeTag && !showAll && (
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

export default SectionWrapper(Projects, "projects");
