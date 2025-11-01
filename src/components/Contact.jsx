import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

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
          className="text-center mb-12"
        >
          <p className={styles.sectionSubText}>Get in touch</p>
          <h3 className="text-white font-black text-4xl sm:text-5xl md:text-6xl mt-2">
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
            className="h-1 w-24 bg-gradient-to-r from-[#00C6FE] to-purple-500 mx-auto mt-4 rounded-full"
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 items-start w-full">
          {/* Form Section */}
          <motion.div
            initial={isMobile ? {} : { opacity: 0, x: -30 }}
            whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full lg:max-w-xl"
          >
            {/* Form container with glassmorphism */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-col gap-6"
              >
                {/* Name Field */}
                <motion.div
                  initial={isMobile ? {} : { opacity: 0, x: -20 }}
                  whileInView={isMobile ? {} : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-col group"
                >
                  <label className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="text-[#00C6FE] text-lg">👤</span>
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="bg-white/5 backdrop-blur-sm border border-white/20 focus:border-[#00C6FE] focus:ring-2 focus:ring-[#00C6FE]/30 py-4 px-6 placeholder:text-secondary/60 text-white rounded-xl outline-none font-medium w-full transition-all duration-300 hover:bg-white/10"
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
                  <label className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="text-purple-400 text-lg">✉️</span>
                    Your Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="bg-white/5 backdrop-blur-sm border border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 py-4 px-6 placeholder:text-secondary/60 text-white rounded-xl outline-none font-medium w-full transition-all duration-300 hover:bg-white/10"
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
                  <label className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="text-green-400 text-lg">💬</span>
                    Your Message
                  </label>
                  <textarea
                    rows={6}
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project..."
                    className="bg-white/5 backdrop-blur-sm border border-white/20 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 py-4 px-6 placeholder:text-secondary/60 text-white rounded-xl outline-none font-medium w-full transition-all duration-300 resize-none hover:bg-white/10"
                  />
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={isMobile ? {} : { opacity: 0, y: 20 }}
                  whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={isMobile ? {} : { scale: 1.02, x: 5 }}
                    whileTap={isMobile ? {} : { scale: 0.98 }}
                    className="relative group w-full bg-gradient-to-r from-[#00C6FE] to-purple-500 hover:from-[#00C6FE]/90 hover:to-purple-500/90 py-4 px-8 rounded-xl outline-none text-white font-bold text-lg transition-all duration-300 shadow-lg shadow-[#00C6FE]/30 hover:shadow-2xl hover:shadow-[#00C6FE]/50 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="flex-1 w-full flex flex-col gap-6"
          >
            {/* Info Card */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h4 className="text-white font-bold text-2xl mb-6 flex items-center gap-2">
                <span className="text-[#00C6FE]">📍</span>
                Get in Touch
              </h4>
              <p className="text-gray-300 leading-relaxed mb-8">
                Have a project in mind or just want to say hi? I'm always open to discussing new opportunities, creative ideas, or partnerships. Let's build something amazing together! 🚀
              </p>

              {/* Quick contact items */}
              <div className="space-y-4">
                <motion.a
                  href="mailto:tiagodias.cl@gmail.com"
                  whileHover={isMobile ? {} : { x: 5 }}
                  className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00C6FE]/50 rounded-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00C6FE]/20 to-[#00C6FE]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📧</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Email</p>
                    <p className="text-gray-400 text-sm">tiagodias.cl@gmail.com</p>
                  </div>
                </motion.a>

                <motion.a
                  href="https://www.linkedin.com/in/tiagofdias/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={isMobile ? {} : { x: 5 }}
                  className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400/20 to-purple-400/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">💼</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">LinkedIn</p>
                    <p className="text-gray-400 text-sm">Connect with me</p>
                  </div>
                </motion.a>

                <motion.a
                  href="https://github.com/tiagofdias"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={isMobile ? {} : { x: 5 }}
                  className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-400/50 rounded-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400/20 to-green-400/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">💻</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">GitHub</p>
                    <p className="text-gray-400 text-sm">Check my repos</p>
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
              className="backdrop-blur-md bg-gradient-to-br from-[#00C6FE]/10 to-purple-500/10 border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">⚡</span>
                <div>
                  <p className="text-white font-semibold mb-2">Quick Response</p>
                  <p className="text-gray-300 text-sm">
                    I typically respond within 24 hours. Looking forward to hearing from you!
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
