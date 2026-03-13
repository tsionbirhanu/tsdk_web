import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Register",
    desc: "Create your free account in under 2 minutes.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5.121 17.804A4 4 0 0111 16h2a4 4 0 015.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Choose Your Action",
    desc: "Select Donate, Aserat, Selet, or Gbir from your dashboard.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor">
        {/* Cursor / hand click icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 11.25V5.75a1.75 1.75 0 113.5 0v5.5m0-3.5a1.75 1.75 0 113.5 0v3.5m0 0a1.75 1.75 0 013.5 0v2.75a4.25 4.25 0 01-8.026 2.032L9.53 16.72A2.75 2.75 0 017.75 16H7a2 2 0 01-2-2v-1.25a1.75 1.75 0 113.5 0"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Give & Track",
    desc: "Receive receipts and monitor your impact in real time.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="py-24 bg-[#f3e3cf] text-[#3b2411]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16">
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-[#8b5829] mb-3">
            Simple Steps
          </p>
          <h2 className="font-['Jomolhari'] text-3xl md:text-4xl font-bold mb-4">
            How TSEDQ Works
          </h2>
          <p className="text-[#4b2e18] max-w-xl mx-auto">
            Designed to be simple for elders, powerful for leaders.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative grid md:grid-cols-3 gap-12 px-6 md:px-16">
          {/* Animated Connecting Line (ONLY between circles) */}
          <div className="hidden md:block absolute top-20 left-[calc(100%/6)] right-[calc(100%/6)] h-px bg-[#d0b896] z-0">
            <motion.div
              className="h-full bg-[#8b5829] origin-left"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="flex flex-col items-center text-center relative z-10">
              {/* Solid Circle (NO transparency) */}
              <div className="w-32 h-32 rounded-full bg-white border border-[#e7d2b4] flex flex-col items-center justify-center mb-6 shadow-md relative z-10">
                <span className="text-[#8b5829] mb-1">{step.icon}</span>
                <span className="font-['Jomolhari'] text-lg font-bold">
                  {step.number}
                </span>
              </div>

              <h3 className="font-['Jomolhari'] text-xl font-semibold mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[#4b2e18] max-w-[250px]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
