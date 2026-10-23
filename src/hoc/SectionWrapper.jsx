import { motion } from "framer-motion";

import { styles } from "../styles";
import { staggerContainer } from "../utils/motion";

const StarWrapper = (Component, idName) =>
  function HOC() {

    if (idName === "hero" || idName === "footer") {
      return (
        <>
          <span className="hash-span pointer-events-none absolute top-0" id={idName}>
            &nbsp;
          </span>
          <Component />
        </>
      );
    }
    
    return (
      <motion.section
        variants={staggerContainer()}
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, amount: 0.05 }}
        className={`${styles.padding} max-w-7xl mx-auto relative z-0 w-full overflow-x-clip ${
          idName === 'myjourney' ? 'min-h-auto' : 'lg:min-h-screen lg:flex lg:flex-col lg:justify-center'
        }`}
      >
        <span className='hash-span pointer-events-none absolute top-0' id={idName}>
          &nbsp;
        </span>

        <Component />
      </motion.section>
    );
  };

export default StarWrapper;