"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import * as reactSpring from "@react-spring/three";

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Testimonials", href: "#" },
    { name: "Changelog", href: "#" },
  ],
  Resources: [
    { name: "User Guide", href: "#" },
    { name: "Community", href: "#" },
    { name: "FAQs", href: "#" },
  ],
  Company: [
    { name: "About Us", href: "/company" },
    { name: "Careers", href: "#" },
    { name: "Contact", href: "#" },
  ],
  Legal: [
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
  ],
};

export const Footer: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      className="relative w-full text-stone-300 overflow-hidden"
    >
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <ShaderGradientCanvas style={{ position: "absolute", inset: 0 }}>
          <ShaderGradient
            control="props"
            type="waterPlane"
            cDistance={20}
            color1="#ffffff"
            color2="#f0f0f0"
            color3="#e5e5e5"
          />
        </ShaderGradientCanvas>
      </div>

      <div className="relative z-10 mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <h2 className="font-timesnow text-5xl text-black">Sevenfold</h2>
            <p className="mt-4 max-w-xs text-stone-400">
              The unified environment for modern, agentic research workflows.
            </p>
            <div className="mt-8 flex gap-4">
              <a
                href="#"
                className="text-stone-400 hover:text-black transition-colors"
              >
                X / Twitter
              </a>
              <a
                href="#"
                className="text-stone-400 hover:text-black transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <nav className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-8 font-inter">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="uppercase tracking-wider text-sm font-semibold text-black mb-4">
                  {category}
                </h3>
                <ul className="space-y-3" role="list">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-stone-400 hover:text-black transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-24 pt-8 border-t border-white/10 text-center text-sm text-stone-500">
          <p>
            &copy; {new Date().getFullYear()} Sevenfold, Inc. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
