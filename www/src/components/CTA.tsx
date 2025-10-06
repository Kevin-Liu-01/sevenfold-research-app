"use client";

import { motion } from "framer-motion";

export const CTA = () => {
  return (
    <section className="w-full h-full bg-teal-900 px-8 py-24 sm:py-32">
      <motion.div
        className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-left">
          <h2 className="mb-4 font-timesnow text-5xl tracking-tight text-white sm:text-6xl">
            Spend Less Time Paper-Chasing & More Time Experimenting.
          </h2>
          <p className="font-dmsans text-xl text-gray-200">
            Sevenfold is currently in alpha. Join early adopters shaping the
            future of research workflows.
          </p>
        </div>
        <div className="lg:text-right">
          <a
            href="#"
            className="inline-block rounded-lg bg-green-300 px-8 py-4 font-dmsans text-lg font-bold text-black transition hover:bg-green-400"
          >
            Try Sevenfold Now
          </a>
        </div>
      </motion.div>
    </section>
  );
};
