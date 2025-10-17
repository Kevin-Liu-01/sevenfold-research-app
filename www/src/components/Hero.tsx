"use client";

import { Fragment } from "react";
import { Sparkles, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { ProductShowcase } from "./ProductShowcase";

export const Hero = () => {
  const TITLE_TEXT =
    "Every Part Of Your Research Workflow, In One Agentic Environment.";
  const titleWords = TITLE_TEXT.split(" ");

  return (
    <section className="relative h-full w-full overflow-hidden text-stone-90 bg-background">
      <div className="relative pt-12 h-full w-full">
        <div className="relative z-10 flex w-full flex-col mx-auto px-12 text-center" style={{ maxWidth: 'var(--max-width-screen)' }}>
          <h1 className="font-timesnow font-normal tracking-tighter text-7xl flex flex-wrap gap-x-3 gap-y-0.5 justify-center">
            {titleWords.map((word, idx) => (
              <Fragment key={idx}>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                >
                  {word}
                </motion.span>
                {word === "Workflow," && <span className="w-full" />}
              </Fragment>
            ))}
          </h1>

          <motion.p
            className="text-xl tracking-tight leading-7 font-dmsans text-stone-600 mt-6 mx-auto"
            style={{ width: '80%' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: titleWords.length * 0.1, ease: "easeOut" }}
          >
            Sevenfold helps you find, digest, and produce research in one centralized workplace,
            <br />
            using project-aware intelligence to eliminate paper-chasing.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: titleWords.length * 0.1 + 0.3, ease: "easeOut" }}
          >
            <a
              href={process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "#"}
              className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-2xl text-lg hover:opacity-90 transition-all"
              style={{
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(0, 0, 0, 0.3)',
                background: 'linear-gradient(to bottom, rgba(60, 60, 60, 1), rgba(30, 30, 30, 1))'
              }}
            >
              Get Started Now
              <Sparkles size={20} strokeWidth={2.5} />
            </a>
            <a
              href="mailto:athan@sevenfold.so?subject=Why%20should%20I%20use%20sevenfold%3F"
              className="inline-flex items-center gap-2 text-gray-700 font-semibold px-8 py-3 rounded-2xl text-lg hover:opacity-90 transition-all border-2 border-gray-400"
              style={{
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1), 0 3px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -2px 0 rgba(0, 0, 0, 0.1)',
                background: '#e5e5e5'
              }}
            >
              Not Convinced?
              <Mail size={20} strokeWidth={2.5} />
            </a>
          </motion.div>

          <div className="mt-12">
            <ProductShowcase />
          </div>
        </div>
      </div>
    </section>
  );
};
