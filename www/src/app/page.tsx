"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CTA } from "../components/CTA";
import { TrustedByCarousel } from "../components/TrustedByCarousel";
import { Hero } from "../components/Hero";
import { Problem } from "../components/Problem";
import { Solution } from "../components/Solution";

const LandingPage = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  const useFoldTransform = (index: number, totalFolds: number) => {
    const start = index / totalFolds;
    const end = (index + 1) / totalFolds;
    const scale = useTransform(scrollYProgress, [start, end], [1, 0.9]);
    const opacity = useTransform(scrollYProgress, [end - 0.05, end], [1, 0]);
    return { scale, opacity };
  };

  const totalFolds = 5;
  const foldTransforms = Array.from({ length: totalFolds }, (_, i) =>
    useFoldTransform(i, totalFolds)
  );

  return (
    <main className="bg-white" ref={scrollRef}>
      <div className="h-[560vh] relative">
        <motion.div
          style={foldTransforms[0]}
          className="sticky top-0 h-[160vh] will-change-transform will-change-opacity"
        >
          <Hero />
        </motion.div>
        <motion.div
          style={foldTransforms[1]}
          className="sticky top-0 h-screen will-change-transform will-change-opacity"
        >
          <TrustedByCarousel />
        </motion.div>
        <motion.div
          style={foldTransforms[2]}
          className="sticky top-0 h-screen will-change-transform will-change-opacity"
        >
          <Problem />
        </motion.div>
        <motion.div
          style={foldTransforms[3]}
          className="sticky top-0 h-screen will-change-transform will-change-opacity"
        >
          <Solution />
        </motion.div>
        <motion.div
          style={foldTransforms[4]}
          className="sticky top-0 h-screen will-change-transform will-change-opacity"
        >
          <CTA />
        </motion.div>
      </div>
    </main>
  );
};

export default LandingPage;
