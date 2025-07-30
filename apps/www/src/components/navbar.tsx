"use client";

import React, { useState } from "react";
import { MenuIcon, XIcon, ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/**
 * Primary site navigation optimised for accessibility & SEO.
 * - semantic <nav> with aria‑label
 * - structured <ul>/<li>/<a> elements so crawlers understand link hierarchy
 * - descriptive alt text on logo image
 * - proper button a11y: aria‑expanded, aria‑controls
 */
export const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav
            aria-label="Primary"
            className="sticky top-0 bg-white w-full z-50 shadow-sm"
        >
            {/* Container */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-3 h-16 items-center">
                    {/* Logo */}
                    <div className="col-span-1 flex items-center">
                        <Link
                            href="/"
                            className="inline-flex items-center"
                            aria-label="Ketspen home"
                        >
                            <Image
                                src="/branding/logo-long.png"
                                alt="Ketspen logo"
                                width={120}
                                height={36}
                                priority
                            />
                        </Link>
                    </div>

                    {/* Desktop navigation links */}
                    <ul
                        className="hidden md:flex col-span-1 justify-center gap-10 text-md font-medium"
                        role="list"
                    >
                        <li>
                            <Link
                                href="#features"
                                className="text-gray-800 hover:text-gray-900"
                            >
                                Features
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/pricing"
                                className="text-gray-800 hover:text-gray-900"
                            >
                                Pricing
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/company"
                                className="text-gray-800 hover:text-gray-900"
                            >
                                Company
                            </Link>
                        </li>
                    </ul>

                    {/* CTA + Mobile toggle */}
                    <div className="col-span-1 flex justify-end items-center">
                        <Link
                            href="/home"
                            className="hidden md:inline-flex items-center gap-1 rounded-lg bg-black px-4 py-2 text-white font-semibold hover:bg-gray-800 transition"
                        >
                            Open&nbsp;App
                            <ArrowUpRightIcon size={18} />
                        </Link>

                        {/* Mobile hamburger */}
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
            </div>

            {/* Mobile navigation panel */}
            <div
                id="mobile-nav"
                className={`md:hidden fixed inset-x-0 top-0 bg-white border-b shadow-lg transition-transform duration-300 ${
                    isOpen ? "translate-y-0" : "-translate-y-full"
                }`}
            >
                <div className="px-4 pt-6 pb-8 space-y-6">
                    {/* Close button */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                        className="ml-auto text-gray-700 hover:text-gray-900"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>

                    <ul role="list" className="space-y-4 text-lg font-medium">
                        <li>
                            <Link
                                href="#features"
                                onClick={() => setIsOpen(false)}
                                className="block text-gray-700 hover:text-gray-900"
                            >
                                Features
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/pricing"
                                onClick={() => setIsOpen(false)}
                                className="block text-gray-700 hover:text-gray-900"
                            >
                                Pricing
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/company"
                                onClick={() => setIsOpen(false)}
                                className="block text-gray-700 hover:text-gray-900"
                            >
                                Company
                            </Link>
                        </li>
                    </ul>

                    {/* CTA buttons */}
                    <div className="pt-4 space-y-3">
                        <Link
                            href="/signup"
                            onClick={() => setIsOpen(false)}
                            className="block rounded-lg bg-black text-white text-center font-semibold px-4 py-2 hover:bg-gray-800 transition"
                        >
                            Sign&nbsp;Up
                        </Link>
                        <Link
                            href="/login"
                            onClick={() => setIsOpen(false)}
                            className="block rounded-lg border border-black text-center font-semibold px-4 py-2 hover:bg-gray-50 transition"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};
