import React, { useState, useEffect } from "react";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { github, webs } from "../assets"; // Make sure these paths are correct!

// ProjectCard component with modal preview and interactive links
const ProjectCard = ({
  index,
  name,
  description,
  tags,
  images,
  source_code_link,
  source_code_link2,
}) => {
  // State for image transitions and modal
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState({ github: false, web: false });

  // Ensure images is always an array
  const projectImages = Array.isArray(images) ? images : [images];

  // Functions to navigate the preview images
  const nextImage = () => {
    setPreviewIndex((prev) => (prev + 1) % projectImages.length);
  };

  const prevImage = () => {
    setPreviewIndex((prev) =>
      prev === 0 ? projectImages.length - 1 : prev - 1
    );
  };

  // Open preview modal starting at the clicked image index
  const openPreview = (index) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  // Close the modal preview
  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  return (
    <div className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full relative">
      {/* Image Container with Hover Effect */}
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

        {/* "+X More" Badge if multiple images exist */}
        {projectImages.length > 1 && (
          <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-xs py-1 px-2 rounded">
            +{projectImages.length - 1} More
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-sm font-bold"
          style={{ pointerEvents: "none" }}
        >
          Click to Preview
        </div>
      </div>

      {/* Project Details */}
      <div className="mt-5">
        <h3 className="text-white font-bold text-[24px]">{name}</h3>
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
            className="text-[14px] px-2.5 py-1 rounded-full bg-gray-700 text-white"
          >
            {tag.name}
          </a>
        ))}
      </div>

      {/* Link Buttons */}
      <div className="absolute top-8 right-8 flex gap-1">
        {source_code_link2 && (
          <div
            className="relative black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
            onClick={() => {
              // Optional confirmation for first project (customize as needed)
              if (index === 0) {
                const userConfirmed = window.confirm(
                  "This website may take some time (1-2 minutes) to load due to the free hosting service. Do you want to continue?"
                );
                if (!userConfirmed) return;
              }
              window.open(source_code_link2, "_blank");
            }}
            onMouseEnter={() => setShowTooltip({ ...showTooltip, web: true })}
            onMouseLeave={() => setShowTooltip({ ...showTooltip, web: false })}
          >
            <img
              src={webs}
              alt="website"
              className="w-1/2 h-1/2 object-contain"
            />
            {showTooltip.web && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded-md shadow-lg whitespace-nowrap">
                Visit Website
              </div>
            )}
          </div>
        )}

        {source_code_link && (
          <div
            className="relative black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
            onClick={() => window.open(source_code_link, "_blank")}
            onMouseEnter={() =>
              setShowTooltip({ ...showTooltip, github: true })
            }
            onMouseLeave={() =>
              setShowTooltip({ ...showTooltip, github: false })
            }
          >
            <img
              src={github}
              alt="source code"
              className="w-1/2 h-1/2 object-contain"
            />
            {showTooltip.github && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded-md shadow-lg whitespace-nowrap">
                View Source Code
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
          onClick={closePreview}
        >
          {/* Fixed-size container for the preview */}
          <div
            className="relative bg-white rounded-lg p-4 w-[70vw] h-[70vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={projectImages[previewIndex]}
              alt={`Preview-${previewIndex}`}
              className="max-w-full max-h-full object-contain rounded-lg transition-opacity duration-500"
            />

            {/* Navigation Buttons */}
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

// Projects component that maps over your projects array
const Projects = () => {
  // Optional: add mobile-specific logic if needed
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      <div className="mt-20 flex flex-wrap gap-7 justify-center">
        {projects.map((project, index) => (
          <ProjectCard key={`project-${index}`} index={index} {...project} />
        ))}
      </div>
    </>
  );
};

export default SectionWrapper(Projects, "projects");
