"use client";

import { motion } from "framer-motion";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
};

const staggerContainer = {
    initial: {},
    whileInView: {
        transition: {
            staggerChildren: 0.15,
        },
    },
    viewport: { once: true, margin: "-100px" },
};

export const ProblemSolution = () => {
    return (
        <section className="bg-gray-950 py-24 px-8">
            <div className="mx-auto max-w-7xl">
                {/* Problem Section */}
                <motion.div
                    className="mb-32"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="mb-3 font-dmsans text-sm font-medium uppercase tracking-wide text-orange-500">
                        The Problem
                    </p>
                    <h2 className="mb-8 font-timesnow text-5xl tracking-tight text-white sm:text-6xl">
                        Research Is Overwhelming
                    </h2>
                    <p className="mb-12 max-w-3xl font-dmsans text-xl leading-relaxed text-gray-300">
                        The explosion of published work and fragmented tools make it harder than ever to stay on top of your field.
                    </p>

                    {/* Problem Stats */}
                    <motion.div
                        className="grid gap-6 sm:grid-cols-2"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-10 transition-all hover:border-gray-700 hover:shadow-xl"
                        >
                            <div className="absolute right-4 top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
                            <div className="relative">
                                <div className="mb-4 font-dmsans text-7xl font-light tracking-tight text-white">
                                    59%
                                </div>
                                <div className="font-dmsans text-lg font-medium text-gray-100">
                                    Increase in research output
                                </div>
                                <div className="mt-2 font-dmsans text-sm text-gray-400">
                                    From 2012 to 2022 — and accelerating
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-10 transition-all hover:border-gray-700 hover:shadow-xl"
                        >
                            <div className="absolute right-4 top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
                            <div className="relative">
                                <div className="mb-4 font-dmsans text-7xl font-light tracking-tight text-white">
                                    8+
                                </div>
                                <div className="font-dmsans text-lg font-medium text-gray-100">
                                    Tools per researcher
                                </div>
                                <div className="mt-2 font-dmsans text-sm text-gray-400">
                                    Search, read, annotate, write — all disconnected
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Solution Section */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="mb-3 font-dmsans text-sm font-medium uppercase tracking-wide text-orange-500">
                        The Solution &amp; Features
                    </p>
                    <h2 className="mb-8 font-timesnow text-5xl tracking-tight text-white sm:text-6xl">
                        One Platform, Complete Control
                    </h2>
                    <p className="mx-auto mb-16 max-w-3xl font-dmsans text-xl leading-relaxed text-gray-300">
                        Sevenfold unifies your entire research workflow in one intelligent workspace—from discovery to publication.
                    </p>

                    {/* Solution Benefits */}
                    <motion.div
                        className="grid gap-8 text-left sm:grid-cols-2 lg:grid-cols-3"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="group"
                        >
                            <div className="mb-2 flex items-start gap-3">
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-kets-green font-dmsans text-xs font-bold text-black">
                                    1
                                </div>
                                <h3 className="font-dmsans text-2xl font-medium text-white">
                                    Semantic Search
                                </h3>
                            </div>
                            <p className="font-dmsans text-base leading-snug text-gray-400">
                                AI-powered discovery that understands research concepts, not just keywords.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="group"
                        >
                            <div className="mb-2 flex items-start gap-3">
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-kets-green font-dmsans text-xs font-bold text-black">
                                    2
                                </div>
                                <h3 className="font-dmsans text-2xl font-medium text-white">
                                    Automated Literature Reviews
                                </h3>
                            </div>
                            <p className="font-dmsans text-base leading-snug text-gray-400">
                                Generate comprehensive reviews with AI-synthesized insights and gap analysis in hours, not weeks.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="group"
                        >
                            <div className="mb-2 flex items-start gap-3">
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-kets-green font-dmsans text-xs font-bold text-black">
                                    3
                                </div>
                                <h3 className="font-dmsans text-2xl font-medium text-white">
                                    Interactive Research Assistant
                                </h3>
                            </div>
                            <p className="font-dmsans text-base leading-snug text-gray-400">
                                Chat with your entire paper library to extract insights and compare methodologies instantly.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="group"
                        >
                            <div className="mb-2 flex items-start gap-3">
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-kets-green font-dmsans text-xs font-bold text-black">
                                    4
                                </div>
                                <h3 className="font-dmsans text-2xl font-medium text-white">
                                    AI Writing Assistant
                                </h3>
                            </div>
                            <p className="font-dmsans text-base leading-snug text-gray-400">
                                Get intelligent writing suggestions grounded in your research library, not generic advice.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="group"
                        >
                            <div className="mb-2 flex items-start gap-3">
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-kets-green font-dmsans text-xs font-bold text-black">
                                    5
                                </div>
                                <h3 className="font-dmsans text-2xl font-medium text-white">
                                    Impact Optimization
                                </h3>
                            </div>
                            <p className="font-dmsans text-base leading-snug text-gray-400">
                                AI-powered review analyzes your manuscript for clarity and impact before submission.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="group"
                        >
                            <div className="mb-2 flex items-start gap-3">
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-kets-green font-dmsans text-xs font-bold text-black">
                                    6
                                </div>
                                <h3 className="font-dmsans text-2xl font-medium text-white">
                                    Smart Citation Engine
                                </h3>
                            </div>
                            <p className="font-dmsans text-base leading-snug text-gray-400">
                                Automatically discover relevant citations and emerging papers as you write.
                            </p>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
