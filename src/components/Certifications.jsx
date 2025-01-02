import React, { useState, useEffect } from "react";

import { styles } from "../styles";
import { webs } from "../assets";
import { SectionWrapper } from "../hoc";
import { certifications } from "../constants";

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  image,
  source_code_link2,
  showSecondLink,
  isMobile,
}) => {
  return (
    <div className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full">
      <div className="relative w-full h-[230px]">
        <img
          src={image}
          alt="project_image"
          className="w-full h-full object-cover rounded-2xl"
        />
        <div className="absolute inset-0 flex justify-end m-3 card-img_hover">
          {showSecondLink && source_code_link2 && (
            <div
              onClick={() => window.open(source_code_link2, "_blank")}
              className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
            >
              <img
                src={webs}
                alt="source code"
                className="w-1/2 h-1/2 object-contain"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-white font-bold text-[24px]">{name}</h3>
        <p className="mt-2 text-secondary text-[14px]">{description}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <a
            key={`${name}-${index}`}
            href={tag.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[14px] ${tag.color || ""}`}
          >
            {tag.name}
          </a>
        ))}
      </div>
    </div>
  );
};

const Certifications = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Set mobile breakpoint (768px)
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        {certifications.map((certification, index) => (
          <ProjectCard
            key={`certification-${index}`}
            index={index}
            {...certification}
            showSecondLink={certification.name !== "Condomix"}
            isMobile={isMobile} // Pass isMobile to ProjectCard
          />
        ))}
      </div>
    </>
  );
};

export default SectionWrapper(Certifications, "certifications");




