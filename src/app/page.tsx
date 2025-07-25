"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import Image from "next/image";

const Hero = () => {
  const animationSpeed = 0.11;
  const titleWords =
    "Every Part Of Your Research Workflow, In One Agentic Environment.".split(
      " "
    );

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: animationSpeed } },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const subtitleDelay = titleWords.length * animationSpeed + 0.3;
  const buttonDelay = subtitleDelay + 0.3;
  const imageDelay = buttonDelay + 0.3;

  const cards = [
    {
      id: 1,
      image: "/images/chatbot-mockup.png",
      title: "Chatbot Mockup",
    },
    {
      id: 2,
      image: "/images/search-mockup.png",
      title: "Search Mockup",
    },
    {
      id: 3,
      image: "/images/pdfviewer-mockup.png",
      title: "PDF Viewer Mockup",
    },
  ];

  return (
    <>
      <section className="w-full max-w-6xl mt-10 mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        <div className="text-left">
          <motion.h1
            className="font-timesnow tracking-tighter text-6xl flex flex-wrap gap-x-2 gap-y-0.5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {titleWords.map((word, idx) => (
              <Fragment key={idx}>
                <motion.span className="inline-block" variants={wordVariants}>
                  {word}
                </motion.span>
                {word === "Workflow," && <span className="w-full" />}
              </Fragment>
            ))}
          </motion.h1>

          <motion.p
            className="text-2xl tracking-tight leading-7 font-inter max-w-2xl text-gray-700 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: subtitleDelay,
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            Ketspen helps you find, digest, and produce research in one
            centralized workplace, using project-aware intelligence to eliminate
            paper-chasing.
          </motion.p>

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

      <section className="w-screen bg-linear-to-b from-white via-kets-yellow to-white">
        <motion.div
          className="flex justify-center -space-x-[25vw] py-16"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { delayChildren: imageDelay, staggerChildren: 0.3 },
            },
          }}
        >
          {cards.slice(0, 3).map((card, i) => (
            <div
              key={i}
              className="w-3/5 rotate-x-45 rotate-y-15 -rotate-z-30 flex-shrink-0"
            >
              <motion.div
                className="w-full h-auto shadow-2xl"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: "easeOut" },
                  },
                }}
              >
                <Image
                  src={card.image}
                  alt={card.title}
                  width={500}
                  height={300}
                  className="w-full h-auto"
                />
              </motion.div>
            </div>
          ))}
        </motion.div>
      </section>
    </>
  );
};

const Carousel = () => {
  const logos = [
    { src: "/images/princeton.png", href: "https://www.princeton.edu" },
    { src: "/images/caltech.png", href: "https://www.caltech.edu" },
    { src: "/images/harvard.png", href: "https://www.harvard.edu" },
    { src: "/images/losalamos.png", href: "https://www.lanl.gov" },
    { src: "/images/at&t.svg", href: "https://www.att.com" },
  ];

  const allLogos = [...logos, ...logos]; // Duplicate for seamless scroll

  return (
    <section className="bg-white py-8">
      <p className="text-gray-800 text-center text-sm uppercase tracking-wide font-bold mb-6">
        Trusted by Researchers at
      </p>
      <div className="relative overflow-hidden max-w-6xl mx-auto h-[100px] slider-mask">
        <div
          className="flex animate-scroll"
          style={{ width: `${allLogos.length * 250}px` }}
        >
          {allLogos.map(({ src, href }, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-[100px] w-[250px]"
            >
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Image
                  src={src}
                  alt={`Logo ${index}`}
                  width={250}
                  height={60}
                  className="h-[60px] object-contain mx-auto transition-opacity hover:opacity-80"
                />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const Features = () => (
  <section className="max-w-6xl mx-auto px-4 py-12 font-dmsans">
    {/* HEADER */}
    <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-4">
      The Research Stack, Rebuilt
    </h2>
    <p className="text-base text-gray-600 text-center mb-10">
      Replace scattered, inefficient tools with Ketspen’s unified
      platform—streamline every step of your research process to move faster,
      think deeper, and publish smarter.
    </p>

    {/* GRID: 1col default → 3cols at md */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Row 1: Wide, then Narrow */}
      <div className="overflow-hidden relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm md:col-span-2">
        {/* text block at 40% */}
        <div className="w-[40%] text-left">
          <h3 className="text-sm font-medium mb-1">
            Smart Results Integration
          </h3>
          <p className="text-xs">
            Drop in your results and notes—Ketspen synthesizes them to identify
            key findings and recommend applicable papers.
          </p>
        </div>
        {/* image placeholder at 40% */}
        <Image
          src="/images/placeholder.png"
          alt="Smart Results Integration"
          width={500}
          height={300}
          className="mt-4 absolute shadow-lg h-[100%] w-auto right-0 bg-gray-200 rounded-lg"
        />
      </div>

      <div className="relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm">
        {/* text at 70% */}
        <div className="w-[70%] text-left">
          <h3 className="text-sm font-medium mb-1">
            Intelligent Annotation Tools
          </h3>
          <p className="text-xs">
            Highlight, summarize and annotate with ease—auto-detect key
            findings, link cited papers and flag relevant sections.
          </p>
        </div>
        <Image
          src="/images/placeholder.png"
          alt="Intelligent Annotation Tools"
          width={500}
          height={300}
          className="mt-4 h-auto w-auto bg-gray-200 rounded-lg"
        />
      </div>

      {/* Row 2: Narrow, then Wide */}
      <div className="relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm">
        <div className="w-[70%] text-left">
          <h3 className="text-sm font-medium mb-1">Unified Paper Library</h3>
          <p className="text-xs">
            Organize preprints, journals, notes and annotations in a single,
            searchable workspace.
          </p>
        </div>
        <Image
          src="/images/placeholder.png"
          alt="Unified Paper Library"
          width={500}
          height={300}
          className="mt-4 h-auto w-auto bg-gray-200 rounded-lg"
        />
      </div>

      <div className="overflow-hidden relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm md:col-span-2">
        <div className="w-[40%] text-left">
          <h3 className="text-sm font-medium mb-1">
            Researcher-Informed Semantic Search
          </h3>
          <p className="text-xs">
            Surface the most impactful papers—Ketspen learns from top
            researchers’ reads, highlights and citations.
          </p>
        </div>
        <Image
          src="/images/placeholder.png"
          alt="Researcher-Informed Semantic Search"
          width={500}
          height={300}
          className="mt-4 absolute shadow-lg h-[100%] w-auto right-0 bg-gray-200 rounded-lg"
        />
      </div>

      {/* Row 3: Wide, then Narrow */}
      <div className="relative overflow-hidden bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm md:col-span-2">
        <div className="w-[40%] text-left">
          <h3 className="text-sm font-medium mb-1">
            AI-Powered Writing & Auto-Citation
          </h3>
          <p className="text-xs">
            Write faster with smart suggestions, real-time citations and
            seamless library integration.
          </p>
        </div>
        <Image
          src="/images/placeholder.png"
          alt="AI-Powered Writing & Auto-Citation"
          width={500}
          height={300}
          className="mt-4 absolute shadow-lg h-[100%] w-auto right-0 bg-gray-200 rounded-lg"
        />
      </div>

      <div className="relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm">
        <div className="w-[70%] text-left">
          <h3 className="text-sm font-medium mb-1">Chat with Your Corpus</h3>
          <p className="text-xs">
            Converse with your entire paper library—ask questions, trace
            arguments and extract insights instantly.
          </p>
        </div>
        <Image
          src="/images/placeholder.png"
          alt="Chat with Your Corpus"
          width={500}
          height={300}
          className="mt-4 bg-gray-200 rounded-lg"
        />
      </div>
    </div>
  </section>
);

const LandingPage = () => (
  <main className="overflow-x-hidden">
    <Hero />
    <Carousel />
    <Features />
  </main>
);

export default LandingPage;
