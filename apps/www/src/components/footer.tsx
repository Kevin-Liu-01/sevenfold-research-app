import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";

export const Footer: React.FC = () => {
    return (
        <footer className="mt-8" role="contentinfo" aria-label="Site footer">
            <div
                className="text-gray-800"
                style={{
                    background:
                        "linear-gradient(to bottom, white 50%, #caffbf)",
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="p-6 rounded-lg text-center">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">
                            Ready to start your research journey?
                        </h2>
                        <Link
                            href="/signup"
                            className="inline-block bg-black text-white font-bold px-6 py-2 rounded-lg text-base hover:bg-blue-700 transition"
                            aria-label="Sign up for Ketspen research platform"
                        >
                            Sign up now{" "}
                            <ArrowRightIcon
                                size={16}
                                className="inline-block ml-2"
                                aria-hidden="true"
                            />
                        </Link>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <nav
                        className="grid grid-cols-2 md:grid-cols-6 gap-2 max-w-4xl"
                        aria-label="Footer navigation"
                    >
                        {/* Column 1: RESOURCES */}
                        <div className="col-span-1">
                            <h3 className="font-bold text-sm uppercase tracking-wide mb-4">
                                RESOURCES
                            </h3>
                            <ul className="" role="list">
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        User Guide
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Changelog
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        FAQs
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Community
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Column 2: LEGAL */}
                        <div className="col-span-1">
                            <h3 className="font-bold text-sm uppercase tracking-wide mb-4">
                                LEGAL
                            </h3>
                            <ul className="" role="list">
                                <li>
                                    <Link
                                        href="/terms"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Terms
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/privacy"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Privacy
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: PRODUCT */}
                        <div className="col-span-2 md:col-span-1">
                            <h3 className="font-bold text-sm uppercase tracking-wide mb-4">
                                PRODUCT
                            </h3>
                            <ul className="" role="list">
                                <li>
                                    <a
                                        href="#features"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Testimonials
                                    </a>
                                </li>
                                <li>
                                    <Link
                                        href="/pricing"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Pricing
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/signup"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Sign Up
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/home"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Web App
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Mobile App
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Desktop App
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Column 4: COMPANY */}
                        <div className="col-span-1">
                            <h3 className="font-bold text-sm uppercase tracking-wide mb-4">
                                COMPANY
                            </h3>
                            <ul className="" role="list">
                                <li>
                                    <Link
                                        href="/company"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Careers
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Team
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Blog
                                    </a>
                                </li>
                                <li>
                                    <Link
                                        href="/contact"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                    >
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 5: SOCIALS */}
                        <div className="col-span-1">
                            <h3 className="font-bold text-sm uppercase tracking-wide mb-4">
                                SOCIALS
                            </h3>
                            <ul className="" role="list">
                                <li>
                                    <a
                                        href="https://linkedin.com/company/ketspen"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                        aria-label="Follow Ketspen on LinkedIn"
                                    >
                                        LinkedIn
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://twitter.com/ketspen"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition"
                                        aria-label="Follow Ketspen on X (Twitter)"
                                    >
                                        X (Twitter)
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Column 6: LOGO & COPYRIGHT - Right Aligned and Slightly Wider */}
                    </nav>
                    <div className="col-span-2 md:col-span-1 md:text-right flex flex-col justify-between">
                        <div className="mb-4">
                            <Image
                                src="/branding/logo-long.png"
                                alt="Ketspen company logo"
                                width={128}
                                height={32}
                                className="h-8 md:ml-auto"
                            />
                        </div>
                        <div className="text-gray-600 text-sm">
                            © 2025 Ketspen Inc.
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
