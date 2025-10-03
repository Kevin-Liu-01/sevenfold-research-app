"use client";

import { motion } from "framer-motion";

export const CTA = () => {
  return (
    <section className="h-screen w-full bg-teal-900 flex items-center justify-center px-8">
      <motion.div
        className="mx-auto flex max-w-7xl items-center justify-between gap-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex-1 text-left">
          <h2 className="mb-4 font-timesnow text-5xl tracking-tight text-white sm:text-6xl">
            Spend Less Time Paper-Chasing
            <br />
            And More Time Experimenting.
          </h2>
          <p className="font-dmsans text-xl text-gray-200">
            Sevenfold is currently in alpha. Join early adopters shaping the
            future of research workflows.
          </p>
        </div>
        <a
          href="#"
          className="flex-shrink-0 rounded-lg bg-green-300 px-8 py-4 font-dmsans text-lg font-bold text-black transition hover:bg-green-400"
        >
          Try Sevenfold Now
        </a>
      </motion.div>
    </section>
  );
};
