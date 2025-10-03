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
  whileInView: { transition: { staggerChildren: 0.15 } },
  viewport: { once: true, margin: "-100px" },
};

export const Problem = () => {
  return (
    <section className="h-screen w-full bg-gray-950 flex items-center justify-center overflow-y-auto px-8 py-24">
      <motion.div
        className="mx-auto max-w-7xl"
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
          The explosion of published work and fragmented tools make it harder
          than ever to stay on top of your field.
        </p>
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
    </section>
  );
};
