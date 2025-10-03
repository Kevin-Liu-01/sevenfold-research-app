import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { Variants, motion } from "framer-motion";
import { Fragment } from "react";
import { ProductShowcase } from "./ProductShowcase";

export const Hero = () => {
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

  return (
    <section className="relative h-full w-full text-stone-50 overflow-hidden">
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

      <div className="relative z-10 flex h-full w-full max-w-7xl flex-col justify-center mx-auto px-8 py-10">
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
            className="text-2xl tracking-tight leading-7 font-inter max-w-2xl text-stone-300 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: subtitleDelay,
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            Sevenfold helps you find, digest, and produce research in one
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
    </section>
  );
};
