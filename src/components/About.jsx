import React from "react";
import { Tilt } from "react-tilt";
import { motion } from "framer-motion";

import { TypeAnimation } from "react-type-animation";
import { styles } from "../styles";
import { services } from "../constants";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";

const ServiceCard = ({ index, title, icon }) => (
  <Tilt className="xs:w-[250px] w-full">
    <motion.div
      variants={fadeIn("right", "spring", index * 0.5, 0.75)}
      className="w-full green-pink-gradient p-[1px] rounded-[20px] shadow-card"
    >
      <div
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className="bg-tertiary rounded-[20px] py-5 px-12 min-h-[280px] flex justify-evenly items-center flex-col"
      >
        <img
          src={icon}
          alt="web-development"
          className="w-16 h-20 object-contain"
        />

        <h3 className="text-white text-[18px] font-bold text-center">
          {title}
        </h3>
      </div>
    </motion.div>
  </Tilt>
);

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
          className="font-bold cursor-pointer hover:text-purple-500"
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
          className="font-bold cursor-pointer hover:text-purple-500"
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
          className="font-bold cursor-pointer hover:text-purple-500"
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

export default SectionWrapper(About, "about");
