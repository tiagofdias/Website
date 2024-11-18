import React from "react";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";
import { testimonials } from "../constants";

import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import "./styles.css";

// import required modules
import { Pagination, Navigation, Autoplay } from "swiper/modules";

/* const FeedbackCard = ({
  index,
  testimonial,
  name,
  designation,
  company,
  image,
}) => (
  < motion.div
    variants={fadeIn("", "spring", index * 0.5, 0.75)}
    className='bg-black-200 p-10 rounded-3xl xs:w-[320px] w-full'
  >
    <p className='text-white font-black text-[48px]'>"</p>

    <div className='mt-1'>
      <p className='text-white tracking-wider text-[18px]'>{testimonial}</p>

      <div className='mt-7 flex justify-between items-center gap-1'>
        <div className='flex-1 flex flex-col'>
          <p className='text-white font-medium text-[16px]'>
            <span className='blue-text-gradient '></span> {name}
          </p>
          <p className='mt-1 text-secondary text-[12px]'>
            {designation} of {company}
          </p>
        </div>

        <img
          src={image}
          alt={`feedback_by-${name}`}
          className='w-10 h-10 rounded-full object-cover'
        />
      </div>
    </div>
  </motion.div >
); */

const Feedbacks = () => {
  return (
    <>
      <div className={`mt-12 bg-black-100 rounded-[20px]`}>
        <div className={`bg-blue rounded-2xl ${styles.padding} min-h-[150px]`}>
          <motion.div variants={textVariant()}>
            <p className={styles.sectionSubText}>What others say about me.</p>
            <h2 className={styles.sectionHeadText}>Testimonials.</h2>
          </motion.div>
        </div>

        <div>
          <Swiper
            slidesPerView={1}
            loop={true}
            navigation={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
            }}
            modules={[Pagination, Autoplay, Navigation]}
            className="mySwiper"
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={index}>
                   <div className="testimonial-rate">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className="fa-solid fa-star"
                      style={{ color: 'rgb(0, 136, 180)' }}
                    > &nbsp;&nbsp;&nbsp;</i>
                  ))}
                </div> 

                <blockquote className="testimonial-quote">
                  "{testimonial.testimonial}"
                </blockquote>

                <div className="testimonial-author">
                  <div className="author-info">
                    <h3>{testimonial.name}</h3>
                    <p>
                      {testimonial.designation} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </>
  );
};

export default SectionWrapper(Feedbacks, "testimonials");
