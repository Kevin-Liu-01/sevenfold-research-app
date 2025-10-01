"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import Image from "next/image";
import { ProductShowcase } from "@/components/ProductShowcase";
import { TrustedByCarousel } from "@/components/TrustedByCarousel";
import { ProblemSolution } from "@/components/ProblemSolution";

const Hero = () => {
    const animationSpeed = 0.11;
    const titleWords =
        "Every Part Of Your Research Workflow, In One Agentic Environment.".split(
            " ",
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

    return (
        <>
            <section className="w-full max-w-7xl mt-6 mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
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
                                {word === "Workflow," && (
                                    <span className="w-full" />
                                )}
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
                        Sevenfold helps you find, digest, and produce research in
                        one centralized workplace, using project-aware
                        intelligence to eliminate paper-chasing.
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

        </>
    );
};
const placeholderImage = "/images/mockups/mockup.webp";

const Features = () => (
    <section className="max-w-7xl mx-auto px-4 py-12 font-dmsans">
        {/* HEADER */}
        <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-4">
            The Research Stack, Rebuilt
        </h2>
        <p className="text-base text-gray-600 text-center mb-10">
            Replace scattered, inefficient tools with Sevenfold’s unified
            platform—streamline every step of your research process to move
            faster, think deeper, and publish smarter.
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
                        Drop in your results and notes—Sevenfold synthesizes them
                        to identify key findings and recommend applicable
                        papers.
                    </p>
                </div>
                {/* image placeholder at 40% */}
                <Image
                    src={placeholderImage}
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
                        Highlight, summarize and annotate with ease—auto-detect
                        key findings, link cited papers and flag relevant
                        sections.
                    </p>
                </div>
                <Image
                    src={placeholderImage}
                    alt="Intelligent Annotation Tools"
                    width={500}
                    height={300}
                    className="mt-4 h-auto w-auto bg-gray-200 rounded-lg"
                />
            </div>

            {/* Row 2: Narrow, then Wide */}
            <div className="relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm">
                <div className="w-[70%] text-left">
                    <h3 className="text-sm font-medium mb-1">
                        Unified Paper Library
                    </h3>
                    <p className="text-xs">
                        Organize preprints, journals, notes and annotations in a
                        single, searchable workspace.
                    </p>
                </div>
                <Image
                    src={placeholderImage}
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
                        Surface the most impactful papers—Sevenfold learns from
                        top researchers’ reads, highlights and citations.
                    </p>
                </div>
                <Image
                    src={placeholderImage}
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
                        Write faster with smart suggestions, real-time citations
                        and seamless library integration.
                    </p>
                </div>
                <Image
                    src={placeholderImage}
                    alt="AI-Powered Writing & Auto-Citation"
                    width={500}
                    height={300}
                    className="mt-4 absolute shadow-lg h-[100%] w-auto right-0 bg-gray-200 rounded-lg"
                />
            </div>

            <div className="relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm">
                <div className="w-[70%] text-left">
                    <h3 className="text-sm font-medium mb-1">
                        Chat with Your Corpus
                    </h3>
                    <p className="text-xs">
                        Converse with your entire paper library—ask questions,
                        trace arguments and extract insights instantly.
                    </p>
                </div>
                <Image
                    src={placeholderImage}
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
        <TrustedByCarousel />
        <ProblemSolution />
    </main>
);

export default LandingPage;
