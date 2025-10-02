"use client";

// MASTER WEB DESIGNER'S NOTE v6:
// This is the definitive version, evolving our aesthetic into "Kinetic Architecture."
// The design fully embraces the user's request for more prominent gradients and unique geometries.
// Gradients are now a primary, energetic force, with the hero featuring a dynamic waterPlane.
// I've introduced more complex, animated SVG geometries like concentric circles and grids, and
// the hero's visual container now uses a custom SVG clip-path for a truly unique shape.
// The result is a perfect synthesis of architectural structure and epic visual dynamism.

import { Fragment, useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import * as reactSpring from "@react-spring/three"; // Required for ShaderGradient
import Image from "next/image";

// --- NEW & UNIQUE SVG Icons & Shapes for UI Flair ---
const ArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7 17L17 7M17 7H8M17 7V16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ConcentricCircles = (props: React.ComponentProps<typeof motion.svg>) => (
  <motion.svg
    width="400"
    height="400"
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <motion.circle
      cx="200"
      cy="200"
      r="199"
      stroke="currentColor"
      strokeWidth="2"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1, delay: 0.2, ease: "circOut" }}
      viewport={{ once: true, amount: 0.5 }}
    />
    <motion.circle
      cx="200"
      cy="200"
      r="133"
      stroke="currentColor"
      strokeWidth="2"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1, delay: 0.4, ease: "circOut" }}
      viewport={{ once: true, amount: 0.5 }}
    />
    <motion.circle
      cx="200"
      cy="200"
      r="67"
      stroke="currentColor"
      strokeWidth="2"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1, delay: 0.6, ease: "circOut" }}
      viewport={{ once: true, amount: 0.5 }}
    />
  </motion.svg>
);

// --- 2. Hero Fold (Fold 1) ---
const HeroFold = () => {
  const animationSpeed = 0.05;
  const titleLine1 = "Every Part Of Your".split(" ");
  const titleLine2 = "Research Workflow,".split(" ");
  const titleLine3 = "In One Agentic".split(" ");
  const titleLine4 = "Environment.".split(" ");

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: animationSpeed, delayChildren: 0.2 },
    },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const subtitleDelay = 0.8;
  const buttonDelay = 0.9;
  const imageDelay = 1.0;

  const cards = [
    {
      id: 1,
      image: "/images/pdfviewer-mockup.png",
      title: "Chatbot Mockup",
      className: "w-[80%] left-[10%] z-10 shadow-2xl",
    },
    {
      id: 2,
      image: "/images/search-mockup.png",
      title: "Search Mockup",
      className: "w-[70%] absolute z-20 top-[20%] left-[-5%] shadow-2xl",
    },
    {
      id: 3,
      image: "/images/chatbot-mockup.png",
      title: "PDF Viewer Mockup",
      className: "w-[70%] absolute z-0 bottom-[5%] right-[15%] shadow-2xl",
    },
  ];

  return (
    <section className="relative h-screen w-full bg-neutral-900 text-stone-50 overflow-hidden">
      {/* UPDATED: Prominent, dynamic waterPlane gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ShaderGradientCanvas style={{ position: "absolute", inset: 0 }}>
          <ShaderGradient
            control="props"
            type="waterPlane"
            cDistance={8}
            cPolarAngle={80}
            color1="#F97316"
            color2="#16A34A"
            color3="#FBBF24"
            uSpeed={0.4}
            uStrength={2.5}
            uDensity={1.5}
            uFrequency={2.0}
          />
        </ShaderGradientCanvas>
      </div>
      <div className="absolute left-1/2 top-0 h-full w-px bg-white/10 hidden lg:block" />

      <div className="relative z-10 w-full h-full max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center px-4 sm:px-6">
        {/* Left Column: Text Content */}
        <div className="pt-20 pl-6 lg:pt-0">
          <motion.h1
            className="font-timesnow tracking-tight text-6xl sm:text-7xl leading-none"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <span className="block">
              {titleLine1.map((word, idx) => (
                <motion.span
                  key={idx}
                  variants={wordVariants}
                  className="inline-block mr-4"
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="block">
              {titleLine2.map((word, idx) => (
                <motion.span
                  key={idx}
                  variants={wordVariants}
                  className="inline-block mr-4"
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="block text-orange-500">
              {titleLine3.map((word, idx) => (
                <motion.span
                  key={idx}
                  variants={wordVariants}
                  className="inline-block mr-4"
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="block text-orange-500">
              {titleLine4.map((word, idx) => (
                <motion.span
                  key={idx}
                  variants={wordVariants}
                  className="inline-block mr-4"
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          <motion.p
            className=" text-lg max-w-md mt-10 text-stone-300 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: subtitleDelay,
              duration: 0.8,
              ease: "easeOut",
            }}
          >
            Sevenfold helps you find, digest, and produce research in one
            centralized workplace, using project-aware intelligence to eliminate
            paper-chasing.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: buttonDelay, duration: 0.8, ease: "easeOut" }}
            className="mt-12"
          >
            <a
              href="#"
              className="group font-inter text-lg inline-flex items-center gap-3 bg-stone-50 text-neutral-900 px-8 py-4 rounded-full transition-transform hover:scale-105 duration-300 ease-in-out shadow-lg"
            >
              <span>Get Started Now</span>
              <ArrowIcon className="w-6 h-6 transition-transform group-hover:rotate-45" />
            </a>
          </motion.div>
        </div>

        {/* Right Column: Visuals with NEW Unique Geometry */}
        <div className="relative w-full h-4/5 hidden lg:flex items-center justify-center">
          <svg width="0" height="0">
            <defs>
              <clipPath id="hero-clip" clipPathUnits="objectBoundingBox">
                <path d="M0.999,0.501 C0.999,0.776,0.776,0.999,0.5,0.999 C0.224,0.999,0.001,0.776,0.001,0.501 C0.001,0.225,0.224,0.002,0.5,0.002 C0.643,0.002,0.773,0.063,0.865,0.16 C0.931,0.229,0.999,0.354,0.999,0.501"></path>
              </clipPath>
            </defs>
          </svg>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: imageDelay - 0.2,
              duration: 1.2,
              ease: "easeOut",
            }}
            className="absolute w-full h-full pointer-events-none"
            style={{ clipPath: "url(#hero-clip)" }}
          >
            <div className="w-full h-full bg-black">
              <ShaderGradientCanvas style={{ width: "100%", height: "100%" }}>
                <ShaderGradient
                  control="props"
                  type="plane"
                  cDistance={4}
                  grain="off"
                  color1="#FDE68A"
                  color2="#F97316"
                  color3="#A7F3D0"
                  uSpeed={0.3}
                  uStrength={1.5}
                  uDensity={1.2}
                />
              </ShaderGradientCanvas>
            </div>
          </motion.div>
          <div
            className="relative w-full h-full"
            style={{ perspective: "1000px" }}
          >
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: imageDelay + i * 0.15,
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`absolute p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 ${card.className}`}
              >
                <Image
                  src={card.image}
                  alt={card.title}
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-md"
                  priority={true}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 3. Carousel Fold (Fold 2) ---
const CarouselFold = () => {
  const logos = [
    {
      src: "/images/princeton.png",
      href: "https://www.princeton.edu",
      name: "Princeton",
    },
    {
      src: "/images/caltech.png",
      href: "https://www.caltech.edu",
      name: "Caltech",
    },
    {
      src: "/images/harvard.png",
      href: "https://www.harvard.edu",
      name: "Harvard",
    },
    {
      src: "/images/losalamos.png",
      href: "https://www.lanl.gov",
      name: "Los Alamos",
    },
    { src: "/images/at&t.svg", href: "https://www.att.com", name: "AT&T" },
  ];
  const allLogos = [...logos, ...logos, ...logos];

  return (
    <section className="relative h-screen w-full bg-white flex flex-col justify-center text-neutral-900 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <ShaderGradientCanvas
          style={{
            position: "absolute",
            inset: 0,
            height: "400%",
            top: "-120%",
          }}
        >
          <ShaderGradient
            control="props"
            type="sphere"
            cameraZoom={1.5}
            color1="#F97316"
            color2="#D1FAE5"
            color3="#FEF3C7"
            uSpeed={0.2}
            uStrength={0.5}
            uDensity={1.2}
            reflection={0.1}
          />
        </ShaderGradientCanvas>
      </div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center z-10 px-4">
        <p className="font-inter text-lg uppercase tracking-[0.3em] text-orange-700">
          Trusted
        </p>
        <h2 className="font-timesnow text-6xl md:text-8xl tracking-tighter mt-2">
          By Innovators at the Forefront
        </h2>
      </div>
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] z-10">
        <motion.div
          className="flex"
          animate={{ x: `-${100 / 3}%` }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        >
          {allLogos.map(({ src, href, name }, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-1/4 sm:w-1/6 flex items-center justify-center group"
            >
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-8 opacity-50 group-hover:opacity-100 transition-opacity duration-500 ease-in-out transform group-hover:scale-110"
              >
                <Image
                  src={src}
                  alt={`${name} Logo`}
                  width={250}
                  height={80}
                  className="h-10 md:h-14 w-auto object-contain"
                />
              </a>
              <div className="w-px h-full bg-black/10" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// --- 4. Feature Fold Component ---
const FeatureFold = ({
  number,
  title,
  subtitle,
  description,
  image,
  align = "left",
  gradientProps,
}: {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  align?: "left" | "right";
  gradientProps: any;
}) => {
  const isLeft = align === "left";
  return (
    <section className="relative h-screen w-full bg-white text-neutral-900 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ShaderGradientCanvas style={{ position: "absolute", inset: 0 }}>
          <ShaderGradient control="props" {...gradientProps} />
        </ShaderGradientCanvas>
      </div>
      <motion.div
        className={`absolute top-10 ${
          isLeft ? "left-10" : "right-10"
        } z-10 text-black/5 font-timesnow text-[200px] md:text-[300px] leading-none select-none`}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.3 }}
      >
        {number}
      </motion.div>

      {/* UPDATED: Replaced star with more unique ConcentricCircles geometry */}
      <ConcentricCircles
        className={`absolute z-0 w-[400px] h-[400px] text-black/10 ${
          isLeft ? "right-[-100px]" : "left-[-100px]"
        } top-1/2 -translate-y-1/2`}
      />

      <div className="absolute left-1/2 top-0 h-full w-px bg-black/5 hidden lg:block" />

      <div
        className={`relative z-20 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
          isLeft ? "" : "lg:grid-flow-col-dense"
        }`}
      >
        <motion.div
          className={` ${isLeft ? "lg:col-start-1" : "lg:col-start-2"}`}
          initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <div className="p-2 bg-white/50 backdrop-blur-md rounded-2xl border border-black/10 shadow-2xl">
            <Image
              src={image}
              alt={title}
              width={1200}
              height={900}
              className="rounded-lg w-full"
            />
          </div>
        </motion.div>
        <motion.div
          className={`text-left ${
            isLeft ? "lg:col-start-2" : "lg:col-start-1 lg:row-start-1"
          }`}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <p className="font-inter uppercase tracking-[0.2em] text-sm text-orange-600">
            {subtitle}
          </p>
          <h3 className="font-timesnow text-5xl md:text-7xl tracking-tighter mt-4">
            {title}
          </h3>
          <div className="h-px w-24 bg-orange-500/30 my-8" />
          <p className="font-inter text-lg text-neutral-600 max-w-md leading-relaxed">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// --- 5. Call to Action Fold ---
const CallToActionFold = () => {
  return (
    <section className="relative h-screen w-full bg-white text-neutral-900 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ShaderGradientCanvas style={{ position: "absolute", inset: 0 }}>
          {/* UPDATED: More dynamic gradient for final CTA */}
          <ShaderGradient
            control="props"
            type="waterPlane"
            cDistance={10}
            grain="off"
            color1="#FDE68A"
            color2="#F97316"
            color3="#A7F3D0"
            uSpeed={0.5}
            uStrength={2.0}
            uDensity={1.5}
          />
        </ShaderGradientCanvas>
      </div>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white to-transparent z-10" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent z-10" />
      <div className="relative z-20">
        <motion.h2
          className="font-timesnow text-6xl md:text-8xl lg:text-9xl tracking-tighter max-w-5xl"
          initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.5 }}
        >
          Rebuild Your Research Stack.
        </motion.h2>
        <motion.p
          className="font-inter text-xl md:text-2xl mt-8 max-w-2xl mx-auto text-neutral-600"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.5 }}
        >
          Move faster, think deeper, and publish smarter with a unified,
          intelligent platform.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.5 }}
          className="mt-16"
        >
          <a
            href="#"
            className="group font-inter text-xl inline-flex items-center gap-3 bg-neutral-900 text-white px-10 py-5 rounded-full transition-transform hover:scale-105 duration-300 ease-in-out shadow-lg shadow-orange-500/20"
          >
            <span>Join The Waitlist</span>
            <ArrowIcon className="w-6 h-6 transition-transform group-hover:rotate-45" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

// --- Main Landing Page Component ---
const LandingPage = () => {
  const featureData = [
    {
      number: "01",
      subtitle: "Synthesize & Discover",
      title: "Smart Results Integration",
      description:
        "Drop in your results and notes—Sevenfold synthesizes them to identify key findings and recommend applicable papers.",
      image: "/images/mockup.webp",
      align: "left",
      gradientProps: {
        type: "plane",
        cDistance: 6,
        color1: "#A7F3D0",
        color2: "#FBBF24",
        color3: "#ffffff",
        uStrength: 0.7,
        uSpeed: 0.2,
        uDensity: 1.0,
      },
    },
    {
      number: "02",
      subtitle: "Annotate & Understand",
      title: "Intelligent Annotation Tools",
      description:
        "Highlight, summarize and annotate with ease—auto-detect key findings, link cited papers and flag relevant sections.",
      image: "/images/mockup.webp",
      align: "right",
      gradientProps: {
        type: "sphere",
        cameraZoom: 3.5,
        color1: "#F97316",
        color2: "#ffffff",
        color3: "#f0f0f0",
        uStrength: 0.4,
        reflection: 0.2,
        uSpeed: 0.1,
      },
    },
    {
      number: "03",
      subtitle: "Converse & Create",
      title: "Chat with Your Corpus",
      description:
        "Converse with your entire paper library—ask questions, trace arguments and extract insights instantly for faster writing and deeper analysis.",
      image: "/images/mockup.webp",
      align: "left",
      gradientProps: {
        type: "waterPlane",
        cDistance: 12,
        color1: "#F3F4F6",
        color2: "#F97316",
        color3: "#A7F3D0",
        uStrength: 1.0,
        uFrequency: 2.0,
        uSpeed: 0.3,
      },
    },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  const useFoldTransform = (index: number, totalFolds: number) => {
    const start = index / totalFolds;
    const end = (index + 1) / totalFolds;
    const scale = useTransform(scrollYProgress, [start, end], [1, 0.9]);
    const opacity = useTransform(scrollYProgress, [end - 0.01, end], [1, 0]);
    return { scale, opacity };
  };

  const totalFolds = 6; // Hero, Carousel, 3 Features, CTA
  const foldTransforms = Array.from({ length: totalFolds }, (_, i) =>
    useFoldTransform(i, totalFolds)
  );

  return (
    <main className="bg-white z-[90]" ref={scrollRef}>
      <div className="fixed top-0 left-0 sm:left-6 h-full w-px bg-white/20 z-[101] pointer-events-none" />
      <div className="fixed top-0 right-0 sm:right-6 h-full w-px bg-white/20 z-[101] pointer-events-none" />

      <div className="h-[600vh] relative">
        <motion.div style={foldTransforms[0]} className="sticky top-0 h-screen">
          <HeroFold />
        </motion.div>
        <motion.div style={foldTransforms[1]} className="sticky top-0 h-screen">
          <CarouselFold />
        </motion.div>
        <motion.div style={foldTransforms[2]} className="sticky top-0 h-screen">
          <FeatureFold {...featureData[0]} />
        </motion.div>
        <motion.div style={foldTransforms[3]} className="sticky top-0 h-screen">
          <FeatureFold {...featureData[1]} />
        </motion.div>
        <motion.div style={foldTransforms[4]} className="sticky top-0 h-screen">
          <FeatureFold {...featureData[2]} />
        </motion.div>
        <motion.div style={foldTransforms[5]} className="sticky top-0 h-screen">
          <CallToActionFold />
        </motion.div>
      </div>
    </main>
  );
};

export default LandingPage;
