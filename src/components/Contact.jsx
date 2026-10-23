import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import useIsMobile from "../utils/useIsMobile";

// 3D Model Component
const StormtrooperModel = () => {
  const { scene, animations } = useGLTF("./models/dancing_stormtrooper.glb");
  const modelRef = useRef(); // Reference to the model

  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    if (actions) {
      // Play the animation
      actions[Object.keys(actions)[0]]?.play();
    }
  }, [actions]);

  // Apply rotation
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = 7;
    }
  }, []);

  return (
    <>
      <ambientLight intensity={3} />
      <pointLight position={[10, 10, 10]} />
      <primitive
        ref={modelRef}
        object={scene}
        scale={1}
        rotation={[0, Math.PI / 12, 0]} // This applies rotation directly
      />
    </>
  );
};

// Contact Component
const Contact = () => {
  const isMobile = useIsMobile();
  const formRef = useRef();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { target } = e;
    const { name, value } = target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!form.name) {
      toast.error("Name is required.");
      return false;
    }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      toast.error("Please enter a valid email.");
      return false;
    }
    if (!form.message) {
      toast.error("Message is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    emailjs
      .send(
        "service_3lf1uj8",
        "template_isj4brk",
        {
          from_name: form.name,
          to_name: "Tiago Dias",
          from_email: form.email,
          to_email: "tiagodias.cl@gmail.com",
          message: form.message,
        },
        "biAIzvFjlZVpRXOvf"
      )
      .then(
        () => {
          setLoading(false);
          toast.success(
            "Thank you. I will get back to you as soon as possible."
          );
          setForm({
            name: "",
            email: "",
            message: "",
          });
        },
        (error) => {
          setLoading(false);
          console.error(error);
          toast.error("Something went wrong. Please try again.");
        }
      );
  };

  return (
    <div className="relative">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-1/4 w-96 h-96 bg-[#00C6FE]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <div className="relative">
        {/* Header with animation */}
        <motion.div
          initial={isMobile ? {} : { opacity: 0, y: -20 }}
          whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-3.5 sm:mb-5 lg:mb-4 xl:mb-6"
        >
          <p className={styles.sectionSubText}>Get in touch</p>
          <h3 className="text-white font-black text-2xl xs:text-3xl sm:text-4xl lg:text-4xl xl:text-5xl mt-1">
            Contact{" "}
            <span className="bg-gradient-to-r from-[#00C6FE] to-purple-500 bg-clip-text text-transparent">
              Me
            </span>
          </h3>
          <motion.div
            initial={isMobile ? {} : { scaleX: 0 }}
            whileInView={isMobile ? {} : { scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-1 w-16 sm:w-20 bg-gradient-to-r from-[#00C6FE] to-purple-500 mx-auto mt-2 sm:mt-2.5 rounded-full"
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-6 xl:gap-8 items-stretch w-full">
          {/* Form Section */}
          <motion.div
            initial={isMobile ? {} : { opacity: 0, x: -30 }}
            whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full lg:max-w-xl"
          >
            {/* Form container with glassmorphism */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-5 xl:p-6 shadow-2xl h-full flex flex-col justify-between">
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-col gap-2.5 sm:gap-3 flex-1 justify-between"
              >
                {/* Name Field */}
                <motion.div
                  initial={isMobile ? {} : { opacity: 0, x: -20 }}
                  whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-col group"
                >
                  <label className="text-white font-semibold mb-1 sm:mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00C6FE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="bg-white/5 backdrop-blur-sm border border-white/20 focus:border-[#00C6FE] focus:ring-2 focus:ring-[#00C6FE]/30 py-2 sm:py-2.5 px-3 sm:px-4 placeholder:text-secondary/60 text-white rounded-lg outline-none font-medium w-full text-xs sm:text-sm transition-all duration-300 hover:bg-white/10"
                  />
                </motion.div>

                {/* Email Field */}
                <motion.div
                  initial={isMobile ? {} : { opacity: 0, x: -20 }}
                  whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col group"
                >
                  <label className="text-white font-semibold mb-1 sm:mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Your Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="recruiter@company.com or name@example.com"
                    className="bg-white/5 backdrop-blur-sm border border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 py-2 sm:py-2.5 px-3 sm:px-4 placeholder:text-secondary/60 text-white rounded-lg outline-none font-medium w-full text-xs sm:text-sm transition-all duration-300 hover:bg-white/10"
                  />
                </motion.div>

                {/* Message Field */}
                <motion.div
                  initial={isMobile ? {} : { opacity: 0, x: -20 }}
                  whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col group"
                >
                  <label className="text-white font-semibold mb-1 sm:mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Your Message
                  </label>
                  <textarea
                    rows={3}
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell me about your job opportunity, project, or role..."
                    className="bg-white/5 backdrop-blur-sm border border-white/20 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 py-2 sm:py-2.5 px-3 sm:px-4 placeholder:text-secondary/60 text-white rounded-lg outline-none font-medium w-full text-xs sm:text-sm transition-all duration-300 resize-none hover:bg-white/10"
                  />
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={isMobile ? {} : { opacity: 0, y: 20 }}
                  whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-1"
                >
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={isMobile ? {} : { scale: 1.02, x: 5 }}
                    whileTap={isMobile ? {} : { scale: 0.98 }}
                    className="relative group w-full bg-gradient-to-r from-[#00C6FE] to-purple-500 hover:from-[#00C6FE]/90 hover:to-purple-500/90 py-2.5 sm:py-3 px-5 sm:px-6 rounded-lg outline-none text-white font-bold text-xs sm:text-sm transition-all duration-300 shadow-md shadow-[#00C6FE]/30 hover:shadow-xl hover:shadow-[#00C6FE]/50 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </span>
                  </motion.button>
                </motion.div>
              </form>
            </div>
          </motion.div>

          {/* Contact Info Cards */}
          <motion.div
            initial={isMobile ? {} : { opacity: 0, x: 30 }}
            whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full flex flex-col justify-between gap-3 sm:gap-4"
          >
            {/* Info Card */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-5 xl:p-6 shadow-2xl flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-white font-bold text-lg sm:text-xl mb-1.5 sm:mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00C6FE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Get in Touch
                </h4>
                <p className="text-gray-300 text-xs sm:text-xs xl:text-sm leading-relaxed mb-3 sm:mb-4">
                  Have a project in mind or just want to connect? I'm always open to discussing new opportunities, creative ideas, or engineering roles. Let's build something great together.
                </p>
              </div>

              {/* Quick contact items */}
              <div className="space-y-2 sm:space-y-2.5">
                <motion.a
                  href="mailto:tiagodias.cl@gmail.com"
                  whileHover={isMobile ? {} : { x: 5 }}
                  className="group flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00C6FE]/50 rounded-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#00C6FE]/20 to-[#00C6FE]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00C6FE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-xs sm:text-sm">Email</p>
                    <p className="text-gray-400 text-[11px] sm:text-xs break-all">tiagodias.cl@gmail.com</p>
                  </div>
                </motion.a>

                <motion.a
                  href="https://www.linkedin.com/in/tiagofdias/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={isMobile ? {} : { x: 5 }}
                  className="group flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-purple-400/20 to-purple-400/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-xs sm:text-sm">LinkedIn</p>
                    <p className="text-gray-400 text-[11px] sm:text-xs">Connect with me</p>
                  </div>
                </motion.a>

                <motion.a
                  href="https://github.com/tiagofdias"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={isMobile ? {} : { x: 5 }}
                  className="group flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-400/50 rounded-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-green-400/20 to-green-400/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-xs sm:text-sm">GitHub</p>
                    <p className="text-gray-400 text-[11px] sm:text-xs">Check my repos</p>
                  </div>
                </motion.a>
              </div>
            </div>

            {/* Fun fact card */}
            <motion.div
              initial={isMobile ? {} : { opacity: 0, scale: 0.9 }}
              whileInView={isMobile ? {} : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="backdrop-blur-md bg-gradient-to-br from-[#00C6FE]/10 to-purple-500/10 border border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-xl"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00C6FE]/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#00C6FE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-xs mb-0.5">Quick Response</p>
                  <p className="text-gray-300 text-[11px] leading-tight">
                    I typically respond within 24 hours. Looking forward to connecting!
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <ToastContainer
        className="custom-toast"
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default SectionWrapper(Contact, "contact");
