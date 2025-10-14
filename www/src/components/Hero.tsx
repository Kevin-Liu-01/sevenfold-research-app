"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { Fragment } from "react";
import { ProductShowcase } from "./ProductShowcase";

export const Hero = () => {
  const TITLE_TEXT =
    "Every Part Of Your Research Workflow, In One Agentic Environment.";
  const titleWords = TITLE_TEXT.split(" ");

  return (
    <section className="relative h-full w-full overflow-hidden text-stone-90 bg-[#f7f7f4]">
      <div className="relative pt-12 h-full w-full">
        <div className="relative z-10 flex w-full flex-col mx-auto px-12 text-center" style={{ maxWidth: 'var(--max-width-screen)' }}>
          <h1 className="font-timesnow tracking-tighter text-6xl flex flex-wrap gap-x-2 gap-y-0.5 justify-center">
            {titleWords.map((word, idx) => (
              <Fragment key={idx}>
                <span className="inline-block">
                  {word}
                </span>
                {word === "Workflow," && <span className="w-full" />}
              </Fragment>
            ))}
          </h1>

          <p className="text-xl tracking-tight leading-7 font-inter text-stone-600 mt-6 mx-auto" style={{ width: '75%' }}>
            Sevenfold helps you find, digest, and produce research in one
            centralized workplace, using project-aware intelligence to
            eliminate paper-chasing.
          </p>

          <div className="mt-8">
            <a
              href="#"
              className="inline-block bg-kets-orange text-white font-semibold px-6 py-3 rounded-lg text-lg hover:bg-kets-yellow transition-colors"
            >
              Get Started Now
            </a>
          </div>

          <div className="mt-12">
            <ProductShowcase />
          </div>
        </div>
      </div>
    </section>
  );
};
