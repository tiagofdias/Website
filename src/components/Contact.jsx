import React, { useRef, useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toast CSS
import { motion } from "framer-motion"; // Import framer-motion
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei"; // Import for 3D model loading

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";

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
    <>
      <motion.p
        className={styles.sectionSubText}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Get in touch
      </motion.p>
      <motion.h3
        className={styles.sectionHeadText}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Contact Me.
      </motion.h3>

      <div className="mt-12 flex flex-col lg:flex-row gap-12 items-start w-full">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col gap-8 w-full lg:max-w-xl"
        >
          {/* Form Fields */}
          <motion.label
            className="flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.1 }}
          >
            <span className="text-white font-medium mb-4">
              <b>Name</b>
            </span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="What's your name?"
              className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium w-full"
            />
          </motion.label>

          <motion.label
            className="flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <span className="text-white font-medium mb-4">
              <b>Email</b>
            </span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="What's your email address?"
              className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium w-full"
            />
          </motion.label>

          <motion.label
            className="flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <span className="text-white font-medium mb-4">
              <b>Message</b>
            </span>
            <textarea
              rows={5}
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="What you want to say?"
              className="bg-tertiary py-3 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium w-full"
            />
          </motion.label>

          <motion.button
            type="submit"
            className="bg-tertiary hover:bg-[#00C6FE] py-3 px-8 rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? "Sending..." : "Send"}
          </motion.button>
        </form>

        {/* 3D Model Canvas (Stormtrooper) */}
        {/*
        <div className="flex justify-end mt-8 ml-25 lg:block hidden">
          <Canvas
            style={{ width: "700px", height: "800px" }}
            camera={{ position: [5, 5, 5], fov: 50 }}
          >
            <StormtrooperModel />
          </Canvas>
        </div>
        */}
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
    </>
  );
};

export default SectionWrapper(Contact, "contact");
