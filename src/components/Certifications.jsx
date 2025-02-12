import React, { useState, useEffect } from "react";
import { styles } from "../styles";
import { webs, github } from "../assets"; // Added github here like in Works
import { SectionWrapper } from "../hoc";
import { certifications } from "../constants";

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  images,
  source_code_link,
  source_code_link2,
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
        {/* Only the certification name gets extra right padding */}
        <h3 className="text-white font-bold text-[24px] break-words pr-20">{name}</h3>
        <p className="mt-2 text-secondary text-[14px]">{description}</p>
      </div>

      {/* Tags Section – Leave this block untouched */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <a
            key={`${name}-${idx}`}
            href={tag.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              text-[14px] px-2.5 py-1 rounded-full transition-all duration-300 transform
              ${
                tag.color === "blue-text-gradient"
                  ? "bg-blue-700 hover:bg-blue-500"
                  : tag.color === "orange-text-gradient"
                  ? "bg-orange-700 hover:bg-orange-500"
                  : tag.color === "red-text-gradient"
                  ? "bg-red-700 hover:bg-red-500"
                  : tag.color === "green-text-gradient"
                  ? "bg-green-700 hover:bg-green-500"
                  : tag.color === "undefined" || "bg-cyan-700 hover:bg-cyan-500"
              } 
              text-white hover:scale-105
            `}
          >
            {tag.name}
          </a>
        ))}
      </div>

      {/* Links Button – Positioning remains unchanged */}
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

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
          onClick={closePreview}
        >
          <div
            className="relative bg-white rounded-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={projectImages[previewIndex]}
              alt={`Preview-${previewIndex}`}
              className="max-w-[70vw] max-h-[70vh] object-contain rounded-lg transition-opacity duration-500"
            />
            {projectImages.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black text-white p-2 rounded-full hover:bg-opacity-70"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                >
                  ◀
                </button>
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black text-white p-2 rounded-full hover:bg-opacity-70"
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
              className="absolute top-3 right-3 text-white text-2xl bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70"
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

const Certifications = () => {
  const [isMobile, setIsMobile] = useState(false);
  // State to control showing all certifications or just a subset
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Show only the first three certifications until "View All" is clicked
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

      {/* Render the "View All" button if there are more than three certifications */}
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




