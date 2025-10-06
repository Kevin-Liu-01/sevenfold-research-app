"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { CTA } from "../components/CTA";
import { TrustedByCarousel } from "../components/TrustedByCarousel";
import { Hero } from "../components/Hero";
import { Problem } from "../components/Problem";
import { Solution } from "../components/Solution";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

// Define your sections here. 'duration' is how many 'vh' of scrolling
// each section will last while it is pinned to the screen.
const sections = [
  { Component: Hero, duration: 250 }, // Increased duration to see all of Hero's content
  { Component: TrustedByCarousel, duration: 120 },
  { Component: Problem, duration: 120 },
  { Component: Solution, duration: 120 },
  { Component: CTA, duration: 120 },
];

const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

const useSectionAnimation = (
  scrollYProgress: MotionValue<number>,
  index: number
) => {
  const cumulativeDurationUpToCurrent = sections
    .slice(0, index + 1)
    .reduce((sum, s) => sum + s.duration, 0);

  const start =
    index === 0
      ? 0
      : (cumulativeDurationUpToCurrent - sections[index].duration) /
        totalDuration;
  const end = cumulativeDurationUpToCurrent / totalDuration;

  const scale = useTransform(scrollYProgress, [start, end], [1, 0.95]);
  const fadeOutStart = end - 20 / totalDuration;
  const opacity = useTransform(scrollYProgress, [fadeOutStart, end], [1, 0]);
  const localProgress = useTransform(scrollYProgress, [start, end], [0, 1]);

  return {
    style: { scale, opacity },
    localProgress,
  };
};

const LandingPage = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  const animations = sections.map((_, index) =>
    useSectionAnimation(scrollYProgress, index)
  );

  return (
    // Set background to transparent to see the shader behind it
    <main className="bg-transparent" ref={scrollRef}>
      <div style={{ height: `${totalDuration}vh` }} className="relative z-10">
        {sections.map(({ Component, duration }, index) => (
          <motion.div
            key={index}
            style={{
              ...animations[index].style,
              height: `${duration}vh`,
            }}
            className="sticky top-0 flex items-center justify-center will-change-transform will-change-opacity"
          >
            <Component scrollProgress={animations[index].localProgress} />
          </motion.div>
        ))}
      </div>
    </main>
  );
};

export default LandingPage;
