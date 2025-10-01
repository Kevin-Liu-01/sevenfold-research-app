"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ProductShowcase } from "@/components/ProductShowcase";
import { TrustedByCarousel } from "@/components/TrustedByCarousel";
import { ProblemSolution } from "@/components/ProblemSolution";
import { CTA } from "@/components/CTA";

const ANIMATION_SPEED = 0.11;
const TITLE_TEXT = "Every Part Of Your Research Workflow, In One Agentic Environment.";

const Hero = () => {
    const titleWords = TITLE_TEXT.split(" ");

    const containerVariants: Variants = {
        hidden: {},
        visible: { transition: { staggerChildren: ANIMATION_SPEED } },
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
        <section className="w-full max-w-7xl mt-6 mx-auto px-8 pt-4 pb-4 relative z-10">
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
                    Sevenfold helps you find, digest, and produce research in one centralized workplace, using project-aware intelligence to eliminate paper-chasing.
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

            <div className="mt-16">
                <ProductShowcase />
            </div>
        </section>
    );
};

const LandingPage = () => (
    <main className="overflow-x-hidden">
        <div className="relative bg-background overflow-hidden w-full">
            <Hero />
            <TrustedByCarousel />
        </div>
        <ProblemSolution />
        <CTA />
    </main>
);

export default LandingPage;
