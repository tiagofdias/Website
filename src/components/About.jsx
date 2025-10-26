import React, { useState, useEffect } from "react";
import { TypeAnimation } from "react-type-animation";
import "react-vertical-timeline-component/style.min.css";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";

const API_URL = import.meta.env.VITE_API_URL;

// -------------------------
// Custom hook to detect mobile devices based on viewport width
// -------------------------
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

// -------------------------
// About Section
// -------------------------
const About = () => {
  const [about, setAbout] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch(`${API_URL}/about`)
      .then((res) => res.json())
      .then((data) => {
        const aboutData = Array.isArray(data) ? data[0] : data;
        setAbout(aboutData);
      })
      .catch(console.error);
  }, []);

  if (!about) return null;

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center">
      <div className="flex-1">
        <div>
          <p className={styles.sectionSubText}>Introduction</p>
          <h2 className={styles.sectionHeadText}>About Me.</h2>
        </div>

        <div className="mt-4 text-[#CCCCCC] text-[17px] max-w-4xl leading-[30px]">
          {about.content &&
            about.content.map((part, i) =>
              part.link ? (
                <a
                  key={i}
                  href={part.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: part.bold ? "bold" : "normal",
                    color: part.color || "#2563eb",
                    transition: "color 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => {
                    if (part.hovercolor) {
                      e.target.style.color = part.hovercolor;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (part.color) {
                      e.target.style.color = part.color;
                    }
                  }}
                >
                  {part.text}
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
          <TypeAnimation
            sequence={about.languages.flatMap((lang) => [lang, 3000])}
            wrapper="span"
            className="text-[#CCCCCC] text-[17px] leading-[30px] font-bold"
            speed={50}
            repeat={Infinity}
          />
        </div>

        <div className="mt-4 text-[#CCCCCC] text-[17px] max-w-3xl leading-[30px]">
          <br />
          <div align="left">
            <img src={about.skills} alt="skills" />
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------
// Timeline Section Components
// -------------------------
const TimelineItem = ({ item }) => (
  <div className="bg-tertiary p-5 rounded-2xl relative shadow-lg">
    {/* Timeline Dot */}
    <div className="absolute top-5 left-[-34px] w-4 h-4 bg-[#00C6FE] rounded-full border-2 border-cyan-500"></div>

    {/* Date */}
    <p className="text-sm text-gray-400">{item.date}</p>

    {/* Title with Link - Updated styling here */}
    <h3 className="text-white font-bold text-[18px]">
      {item.titleLink ? (
        <a
          href={item.titleLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-[#00C6FE]" // Changed from text-gray-300 to text-white
        >
          {item.title}
        </a>
      ) : (
        <span className="text-white">{item.title}</span> // Added span with text-white
      )}
    </h3>

    {/* Company Name with Link */}
    {item.company_name && (
      <p className="text-sm text-cyan-100">
        {item.companyLink ? (
          <a
            href={item.companyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00C6FE]"
          >
            {item.company_name}
          </a>
        ) : (
          item.company_name
        )}
      </p>
    )}
    <br />
    {/* Bullet Points */}
    {item.points?.length > 0 && (
      <ul className="text-sm text-secondary mt-2 space-y-2">
        {item.points.map((point, idx) => (
          <li key={idx} className="flex items-start">
            <span className="mr-2 text-cyan-500">•</span>
            {point.text}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const TimelineSection = ({ items, sectionTitle }) => {
  return (
    <div className="mb-8">
      <h2 className="text-4xl font-bold text-white mb-4">{sectionTitle}</h2>
      <div className="relative border-l-4 border-cyan-500 pl-6 space-y-6">
        {items.map((item, index) => (
          <TimelineItem key={index} item={item} />
        ))}
      </div>
    </div>
  );
};

const Timeline = () => {
  const [showAll, setShowAll] = useState(false);
  const [education, setEducation] = useState([]);
  const [proexp, setProexp] = useState([]);

  useEffect(() => {
    // Fetch and filter education data
    fetch(`${API_URL}/education`)
      .then((res) => res.json())
      .then((data) => {
        const enabledEducation = data
          .filter(item => item.enabled)
          .sort((a, b) => a.order - b.order);
        setEducation(enabledEducation);
      })
      .catch((err) => console.error("Failed to fetch education:", err));

    // Fetch and filter professional experience data
    fetch(`${API_URL}/proexp`)
      .then((res) => res.json())
      .then((data) => {
        const enabledProexp = data
          .filter(item => item.enabled)
          .sort((a, b) => a.order - b.order);
        setProexp(enabledProexp);
      })
      .catch((err) => console.error("Failed to fetch proexp:", err));

    // Listen for chat widget expand event
    const handleExpandEvent = () => {
      setShowAll(true);
    };
    
    window.addEventListener('expandAboutSection', handleExpandEvent);
    
    return () => {
      window.removeEventListener('expandAboutSection', handleExpandEvent);
    };
  }, []);

  if (!showAll) {
    return (
      <div className="flex justify-center mt-10">
        <button
          onClick={() => setShowAll(true)}
          className="bg-tertiary transition-transform duration-300 transform hover:scale-110 hover:bg-[#00C6FE] outline-none shadow-md shadow-primary text-white font-bold py-2 w-[1000px] rounded-3xl"
        >
          Tell me More
        </button>
      </div>
    );
  }

  return (
    <>
      <br />
      <br />
      <br />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TimelineSection items={education} sectionTitle="Education" />
        <TimelineSection items={proexp} sectionTitle="Experience" />
      </div>
    </>
  );
};

// -------------------------
// Merged Component
// -------------------------
const AboutAndTimeline = () => {
  return (
    <div>
      {/* About Section */}
      <About />
      {/* Timeline Section */}
      <Timeline />
    </div>
  );
};

export default SectionWrapper(AboutAndTimeline, "about");





