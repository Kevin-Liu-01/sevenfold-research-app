"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { Variants, motion, useTransform, MotionValue } from "framer-motion";
import { Fragment } from "react";
import { ProductShowcase } from "./ProductShowcase";

// 1. Component now accepts the scrollProgress prop from the landing page
interface HeroProps {
  scrollProgress: MotionValue<number>;
}

export const Hero = ({ scrollProgress }: HeroProps) => {
  const ANIMATION_SPEED = 0.11;
  const TITLE_TEXT =
    "Every Part Of Your Research Workflow, In One Agentic Environment.";
  const titleWords = TITLE_TEXT.split(" ");

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: ANIMATION_SPEED },
    },
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

  const subtitleDelay = titleWords.length * ANIMATION_SPEED + 0.3;
  const buttonDelay = subtitleDelay + 0.3;

  // 2. Create the vertical scroll animation.
  // The content is 250vh tall (from LandingPage config), and the screen is 100vh.
  // So, we need to move the content up by 150vh to see the bottom.
  const y = useTransform(scrollProgress, [0, 1], ["0vh", "-120vh"]);

  return (
    // This outer section acts as a 100vh "window" with overflow hidden
    <section className="relative h-full w-full overflow-hidden text-stone-90">
      <motion.div style={{ y }} className="relative pt-62 h-full w-full">
        <div className="absolute rotate-180 inset-0 z-0 pointer-events-none">
          <ShaderGradientCanvas
            style={{ position: "absolute", inset: 0, opacity: 0.8 }}
          >
            <ShaderGradient
              control="props"
              type="waterPlane"
              cDistance={8}
              color1="#f7f7f4"
              color2="#F8BA7B"
              color3="#F8BA7B"
              uSpeed={0.1}
              uStrength={1}
              uDensity={1.4}
              uFrequency={1.5}
            />
          </ShaderGradientCanvas>
        </div>

        {/* This div structures the content inside the 250vh scrollable area */}
        <div className="relative z-10 flex w-full max-w-7xl flex-col mx-auto px-8">
          {/* This container is 100vh tall to position the initial content */}
          <div className="flex h-screen flex-col justify-center">
            <div className="text-left">
              <motion.h1
                className="font-timesnow tracking-tighter text-6xl flex flex-wrap gap-x-2 gap-y-0.5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {titleWords.map((word, idx) => (
                  <Fragment key={idx}>
                    <motion.span
                      className="inline-block"
                      variants={wordVariants}
                    >
                      {word}
                    </motion.span>
                    {word === "Workflow," && <span className="w-full" />}
                  </Fragment>
                ))}
              </motion.h1>

              <motion.p
                className="text-2xl tracking-tight leading-7 font-inter max-w-2xl text-stone-800 mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: subtitleDelay,
                  duration: 0.6,
                  ease: "easeOut",
                }}
              >
                Sevenfold helps you find, digest, and produce research in one
                centralized workplace, using project-aware intelligence to
                eliminate paper-chasing.
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
                  className="inline-block bg-stone-50 text-neutral-900 font-semibold px-6 py-3 rounded-lg text-lg hover:bg-stone-200 transition-colors"
                >
                  Get Started Now
                </a>
              </motion.div>
            </div>
            <div className="mt-12">
              <ProductShowcase />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
