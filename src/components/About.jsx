import React, { useState } from "react";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import "react-vertical-timeline-component/style.min.css";

import { styles } from "../styles";
import { education, proexp } from "../constants";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";

// About Section
const About = () => {
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Introduction</p>
        <h2 className={styles.sectionHeadText}>About Me.</h2>
      </motion.div>

      <motion.div
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-[#CCCCCC] text-[17px] max-w-3xl leading-[30px]"
      >
        As a{" "}
        <motion.span
          className="font-bold cursor-pointer hover:text-[#00C6FE]"
          whileHover={{ scale: 1.1 }}
          onClick={() =>
            window.open(
              "https://www.istec.pt/index.php/en/master-in-computer-science/",
              "_blank"
            )
          }
        >
          Master’s student
        </motion.span>{" "}
        in{" "}
        <motion.span className="font-bold" whileHover={{ scale: 1.1 }}>
          Computer Science
        </motion.span>{" "}
        with a{" "}
        <motion.span
          className="font-bold cursor-pointer hover:text-[#00C6FE]"
          whileHover={{ scale: 1.1 }}
          onClick={() =>
            window.open(
              "https://www.istec.pt/index.php/en/eng_licenciatura-em-informatica/"
            )
          }
        >
          Bachelor's degree
        </motion.span>{" "}
        in the same field, I am driven by a deep passion for technology. Based
        in{" "}
        <motion.span
          className="font-bold cursor-pointer hover:text-[#00C6FE]"
          whileHover={{ scale: 1.1 }}
          onClick={() =>
            window.open(
              "https://www.google.pt/maps/place/P%C3%B3voa+de+Santa+Iria/@38.8561744,-9.0787744,15z/data=!3m1!4b1!4m6!3m5!1s0xd192ee6d083400f:0x4be91acfd4eaf376!8m2!3d38.8613001!4d-9.0649483!16s%2Fg%2F11bc5htv50?entry=ttu&g_ep=EgoyMDI0MTIxMS4wIKXMDSoASAFQAw%3D%3D",
              "_blank"
            )
          }
        >
          Póvoa de Santa Iria, Lisbon, Portugal
        </motion.span>
        , I’ve gained problem-solving skills through various internships. I am
        also able to speak in
        <TypeAnimation
          sequence={[" Portuguese (C2).", 3000, " English (C1).", 3000]}
          wrapper="span"
          className="text-[#CCCCCC] text-[17px] leading-[30px] font-bold"
          speed={50}
          repeat={Infinity}
        />
      </motion.div>

      <motion.div
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-[#CCCCCC] text-[17px] max-w-3xl leading-[30px]"
      >
        <br />
        <div align="left">
          <img
            src="https://skillicons.dev/icons?i=cs,js,html,css,dotnet,postman,vite,react,nodejs,postgres"
            alt="skills"
          />
        </div>
      </motion.div>
    </>
  );
};

// Timeline Section
const TimelineItem = ({ item }) => (
  <div className="bg-tertiary p-5 rounded-2xl relative shadow-lg">
    {/* Timeline Dot */}
    <div className="absolute top-5 left-[-34px] w-4 h-4 bg-[#00C6FE] rounded-full border-2 border-cyan-500"></div>

    {/* Date */}
    <p className="text-sm text-gray-400">{item.date}</p>

    {/* Title with Link */}
    <h3 className="text-white font-bold text-[18px]">
      {item.titleLink ? (
        <a
          href={item.titleLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-[#00C6FE]"
        >
          {item.title}
        </a>
      ) : (
        item.title
      )}
    </h3>
    <br />
    {/* Company Name with Link */}
    {item.company_name && (
      <p className="text-sm text-gray-400">
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

const TimelineSection = ({ items, sectionTitle }) => (
  <div className="mb-8">
    <h2 className="text-4xl font-bold text-white mb-4">{sectionTitle}</h2>
    <div className="relative border-l-4 border-cyan-500 pl-6 space-y-6">
      {items.map((item, index) => (
        <TimelineItem key={index} item={item} />
      ))}
    </div>
  </div>
);

const Timeline = () => {
  const [showAll, setShowAll] = useState(false);

  if (!showAll) {
    return (
      <div className="flex justify-center mt-10">
        <button
          onClick={() => setShowAll(true)}
          className="bg-tertiary transition-transform duration-300 transform hover:scale-110 hover:bg-[#00C6FE] outline-none shadow-md shadow-primary text-white font-bold py-2 w-[1000px] rounded-3xl"
        >Tell me More
        </button>
      </div>
    );
  }

  return (
    <>
    <br></br>
    <br></br>
    <br></br>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <TimelineSection items={education} sectionTitle="Education" />
      <TimelineSection items={proexp} sectionTitle="Experience" />
    </div>
    </>
  );
};

// Merged Component
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

