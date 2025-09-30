import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
    return (
        <footer
            className="mt-8 border-t border-gray-200 bg-white"
            role="contentinfo"
            aria-label="Site footer"
        >
            <div className="max-w-6xl mx-auto flex flex-col gap-6 px-4 py-10 text-gray-700 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
                <nav aria-label="Footer navigation">
                    <ul className="flex flex-wrap gap-4 text-sm" role="list">
                        <li>
                            <Link
                                href="/terms"
                                className="transition-colors hover:text-gray-900"
                            >
                                Terms
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/privacy"
                                className="transition-colors hover:text-gray-900"
                            >
                                Privacy
                            </Link>
                        </li>
                        <li>
                            <a
                                href="https://www.linkedin.com/company/sevenfoldinc"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors hover:text-gray-900"
                                aria-label="Follow Sevenfold on LinkedIn"
                            >
                                LinkedIn
                            </a>
                        </li>
                    </ul>
                </nav>

                <p className="text-sm text-gray-500">© 2025 Sevenfold Inc.</p>
            </div>
        </footer>
    );
};
