"use client";

import { motion } from "framer-motion";

export const CTA = () => {
  return (
    <section className="w-full bg-teal-900 py-20 sm:py-32">
      <motion.div
        className="mx-auto flex flex-col lg:flex-row items-center gap-10 px-12"
        style={{ maxWidth: 'var(--max-width-screen)' }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-left w-full lg:w-2/3">
          <h2 className="mb-4 font-timesnow text-5xl tracking-tight text-white sm:text-6xl">
            Spend Less Time Paper-Chasing & More Time Experimenting.
          </h2>
          <p className="font-dmsans text-xl text-gray-200">
            Sevenfold is currently in alpha. Join early adopters shaping the
            future of research workflows.
          </p>
        </div>
        <div className="w-full lg:w-1/3 flex items-center justify-center">
          <a
            href="#"
            className="inline-block rounded-lg bg-white px-8 py-4 font-dmsans text-lg font-bold text-black transition hover:bg-gray-100"
          >
            Try Sevenfold Now
          </a>
        </div>
      </motion.div>
    </section>
  );
};
