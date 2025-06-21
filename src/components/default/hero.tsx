import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

export const Hero: React.FC = () => {
  const animationSpeed = 0.11;
  const titleWords = "Every Part Of Your Research Workflow, In One Agentic Environment.".split(" ");

  // Container for words only
  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: animationSpeed } },
  };

  // Individual word animation
  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Calculate delays
  const subtitleDelay = titleWords.length * animationSpeed + 0.3;
  const buttonDelay = subtitleDelay + 0.3;
  const imageDelay = buttonDelay + 0.3;

  const cards = [
    {
      id: 1,
      image: "/images/chatbot-mockup.png",
      title: "Mountain Vista"
    },
    {
      id: 2,
      image: "/images/search-mockup.png",
      title: "Ocean Waves"
    },
    {
      id: 3,
      image: "/images/pdfviewer-mockup.png",
      title: "Forest Path"
    }
  ];

  return (
    <>
      <section className="w-full max-w-6xl mt-10 mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">

        {/* Title */}
        <div className="text-left">
          <motion.h1
              className="font-timesnow tracking-tighter text-6xl flex flex-wrap gap-x-2 gap-y-0.5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {titleWords.map((word, idx) => (
                <React.Fragment key={idx}>
                  <motion.span className="inline-block" variants={wordVariants}>
                    {word}
                  </motion.span>

                  {word === "Workflow," && ( <span className="w-full" /> )}
                </React.Fragment>
              ))}
            </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-2xl tracking-tight leading-7 font-dmsans font-light max-w-2xl text-gray-700 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: subtitleDelay,
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            Ketspen helps you find, digest, and produce research in one centralized
            workplace, using project-aware intelligence to eliminate paper-chasing.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: buttonDelay,
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            <a
              href="#"
              className="inline-block bg-black text-white font-light px-3 py-2 rounded-lg text-lg hover:bg-gray-800 transition"
            >
              Get Started Now
            </a>
          </motion.div>
        </div>
      </section>
      <section className="w-screen">
        <motion.div
          className="flex justify-center -space-x-[25vw]"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { delayChildren: imageDelay, staggerChildren: 0.3 } },
          }}
        >
          {cards.slice(0,3).map((card, i) => (
            <div
              key={i}
              className="w-3/5 rotate-x-45 rotate-y-15 -rotate-z-30 flex-shrink-0"
            >
              <motion.img
                src={card.image}
                className="w-full h-auto shadow-2xl"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show:  { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
                }}
              />
            </div>
          ))}
        </motion.div>
      </section>
    </>
  );
}