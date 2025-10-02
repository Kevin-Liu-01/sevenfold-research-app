"use client";
import Image from "next/image";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuIcon, XIcon, ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import * as reactSpring from "@react-spring/three";

const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
const appBaseUrl = rawAppUrl.replace(/\/$/, "");

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Company", href: "/company" },
  ];

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: "-100%" },
    visible: {
      opacity: 1,
      y: "0%",
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      y: "-100%",
      transition: { duration: 0.4, ease: [0.6, 0.05, -0.01, 0.9] },
    },
  };

  return (
    <nav aria-label="Primary" className="fixed top-0 w-full z-[100] text-white">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 h-20 items-center">
          <div className="col-span-1 flex items-center">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="Sevenfold home"
            >
              {/* <Image
                src="/branding/logo-long.png"
                alt="Sevenfold logo"
                width={120}
                height={36}
                priority
              /> */}
              <div className="hidden md:flex">
                <Image
                  src="/branding/logo-sq.png"
                  alt="Sevenfold logo square"
                  width={36}
                  height={36}
                  className="ml-2"
                  priority
                />
                <div className=" ml-2 ">
                  <div className="font-timesnow text-3xl tracking-tighter">
                    Sevenfold
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <ul
            className="hidden md:flex col-span-1 justify-center gap-10 text-md font-inter"
            role="list"
          >
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="relative pb-1 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="col-span-1 flex justify-end items-center gap-4">
            <Link
              href={appBaseUrl}
              className="hidden md:inline-flex items-center gap-2 font-inter text-sm px-5 py-2.5 border border-white/40 rounded-full hover:border-white hover:bg-white hover:text-neutral-900 transition-colors duration-300"
            >
              <span>Open App</span>
              <ArrowUpRightIcon size={16} />
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
              aria-controls="mobile-nav"
              aria-expanded={false}
              className="md:hidden"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav"
            className="md:hidden fixed inset-0 z-[110] bg-neutral-900/50 backdrop-blur-2xl"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="absolute inset-0 z-0 pointer-events-none">
              <ShaderGradientCanvas style={{ position: "absolute", inset: 0 }}>
                <ShaderGradient
                  control="props"
                  type="sphere"
                  cameraZoom={1}
                  color1="#F97316"
                  color2="#16A34A"
                  color3="#FBBF24"
                  uSpeed={0.3}
                  uStrength={0.5}
                />
              </ShaderGradientCanvas>
            </div>

            <div className="relative z-10 flex flex-col h-full p-4 sm:p-6">
              <div className="flex justify-between items-center mb-16">
                <Link
                  href="/"
                  className="font-timesnow text-3xl tracking-tighter"
                  onClick={() => setIsOpen(false)}
                >
                  Sevenfold
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>

              <ul
                role="list"
                className="flex flex-col items-center gap-8 text-2xl font-inter text-center"
              >
                {navLinks.map((link) => (
                  <li key={`mobile-${link.name}`}>
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-2 hover:mix-blend-difference"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-4 mix-blend-difference">
                <Link
                  href={appBaseUrl}
                  className="w-full text-center font-inter text-lg px-5 py-3 border border-white/40 rounded-full hover:border-white hover:bg-white hover:text-neutral-900 transition-colors duration-300"
                >
                  Open App
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
