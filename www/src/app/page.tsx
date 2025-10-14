"use client";

import { CTA } from "../components/CTA";
import { TrustedByCarousel } from "../components/TrustedByCarousel";
import { Hero } from "../components/Hero";
import { Problem } from "../components/Problem";
import { Solution } from "../components/Solution";

const sections = [
  { Component: Hero },
  { Component: TrustedByCarousel },
  { Component: Problem },
  { Component: Solution },
  { Component: CTA },
];

const LandingPage = () => {
  return (
    <main className="bg-transparent">
      <div className="relative z-10">
        {sections.map(({ Component }, index) => (
          <div key={index}>
            <Component />
          </div>
        ))}
      </div>
    </main>
  );
};

export default LandingPage;
