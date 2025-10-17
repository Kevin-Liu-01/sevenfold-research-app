"use client";

import { useState } from "react";
import { MenuIcon, XIcon, ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "").replace(
  /\/$/,
  ""
);

const BOX_SHADOW =
  "0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)";

const GLASSMORPHISM_STYLE = {
  background: "rgba(255, 255, 255, 0.6)",
  border: "0.5px solid rgba(0, 0, 0, 0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 w-full bg-background"
    >
      <div
        className="mx-auto flex h-16 items-center justify-between px-12"
        style={{ maxWidth: 'var(--max-width-screen)' }}
      >
        <Link
          href="/"
          className="inline-flex items-center"
          aria-label="Sevenfold home"
        >
          <Image
            src="/branding/logo-long.svg"
            alt="Sevenfold logo"
            width={156}
            height={46}
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={APP_BASE_URL}
            className="hidden md:inline-flex items-center gap-1.5 rounded-2xl px-5 py-2 text-white font-semibold hover:opacity-90 transition-all"
            style={{
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(0, 0, 0, 0.3)',
              background: 'linear-gradient(to bottom, rgba(60, 60, 60, 1), rgba(30, 30, 30, 1))'
            }}
          >
            Open&nbsp;App
            <ArrowUpRightIcon size={16} strokeWidth={2.5} />
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-controls="mobile-nav"
            aria-expanded={isOpen}
            className="md:hidden ml-2 text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            {isOpen ? (
              <XIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`md:hidden fixed inset-x-0 top-0 bg-background transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="px-4 pt-6 pb-8 space-y-6">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="ml-auto text-gray-700 hover:text-gray-900"
          >
            <XIcon className="h-6 w-6" />
          </button>

          <ul role="list" className="space-y-4 text-lg font-medium" />

          <div className="pt-4 space-y-3">
            <Link
              href={`${APP_BASE_URL}/signup`}
              onClick={() => setIsOpen(false)}
              className="block rounded-full bg-black text-white text-center font-semibold px-6 py-3 hover:bg-gray-800 transition-all hover:shadow-lg"
              style={{ boxShadow: BOX_SHADOW }}
            >
              Sign&nbsp;Up
            </Link>
            <Link
              href={`${APP_BASE_URL}/signin`}
              onClick={() => setIsOpen(false)}
              className="block rounded-full text-center font-semibold px-6 py-3 transition-all hover:shadow-md"
              style={GLASSMORPHISM_STYLE}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
