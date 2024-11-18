import { motion } from "framer-motion";
import { styles } from "../styles";
import { TypeAnimation } from "react-type-animation";
import * as React from "react";
import tiago from "../assets/tiago.png";

const Hero = () => {
  return (
    <section className={`relative w-full h-screen mx-auto`}>
      <div
        className={`absolute inset-0 top-[120px] max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}
      >
        <div className="flex flex-col justify-center items-center mt-5">
          <div className="w-5 h-5 rounded-full bg-[#915EFF]" />
          <div className="w-1 sm:h-80 h-40 violet-gradient" />
        </div>

        <div>
          <h1 className={`${styles.heroHeadText} text-white`}>
            Hi, I'm <span className="text-[#915EFF]">Tiago</span>
          </h1>
          <p className={`${styles.heroSubText} mt-2 text-white-100`}>
            I'm a Junior Software Developer <br className="sm:block hidden" />
          </p>
          <p className={`${styles.heroSubText} mt-2 text-white-100`}>
            I live in Póvoa de Santa Iria, Lisbon, Portugal{" "}
            <br className="sm:block hidden" />
          </p>
          <TypeAnimation
            sequence={[
              "I can speak Portuguese (C2)",
              3000,
              "I can speak English (C1)",
              3000,
            ]}
            wrapper="span"
            speed={50}
            className="type-animation"
            repeat={Infinity}
          />
        </div>
      </div>

      <motion.div
  style={{
    bottom: "35%", // Responsive positioning
    left: "70%", // Center horizontally
    transform: "translateX(-50%)", // Ensure proper centering
    position: "absolute",
    cursor: "pointer",
  }}
  initial={{ opacity: 0, y: -30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1 }}
>
  <motion.img
    src = {tiago}
    alt="Decorative"
    className="decorative-image"
    whileHover={{
      scale: 1.1,
      rotate: 5,
      borderImage: "#915EFF",
      boxShadow: "0 0 20px 5px rgba(135, 5, 255, 0.6)", // Glow effect
    }}
    transition={{
      scale: { type: "spring", stiffness: 300, damping: 20 },
      rotate: { type: "spring", stiffness: 200, damping: 20 },
      borderImage: { duration: 0.3 },
      boxShadow: { duration: 0.3 }, // Smooth transition for the box-shadow (glow)
    }}
  />
</motion.div>


      <div className="button-container">

        {/* Button for LinkedIn */}
        <motion.a
          href="https://www.linkedin.com/in/tiagofdias/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-btn"
          whileHover={{
            scale: 1.1,
            boxShadow: "0 0 20px 5px rgba(135, 5, 255, 0.6)",
          }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 20 },
          }}
        >
          LinkedIn
        </motion.a>

        {/* Button for GitHub */}
        <motion.a
          href="https://github.com/tiagofdias"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-btn"
          whileHover={{
            scale: 1.1,
            boxShadow: "0 0 20px 5px rgba(135, 5, 255, 0.6)",
          }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 20 },
          }}
        >
          GitHub
        </motion.a>

        {/* Button for Email */}
        <motion.a
          href="mailto:tiagodias.cl@gmail.com"
          className="rounded-btn"
          whileHover={{
            scale: 1.1,
            boxShadow: "0 0 20px 5px rgba(135, 5, 255, 0.6)",
          }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 20 },
          }}
        >
          Email
        </motion.a>

        {/* Button for Download CV */}
        <motion.a
          href="src\components\CV.pdf"
          download
          className="rounded-btn"
          whileHover={{
            scale: 1.1,
            boxShadow: "0 0 20px 5px rgba(135, 5, 255, 0.6)",
          }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 20 },
          }}
        >
          Download CV
        </motion.a>
      </div>

      <div className="bottom-indicator-container">
        <a href="#about">
          <div className="indicator-wrapper">
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="indicator-circle"
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
