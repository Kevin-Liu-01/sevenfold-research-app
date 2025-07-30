// src/components/default/LegalLayout.tsx
import React from "react";
import Link from "next/link";

const navItems = [
    {
        id: "user",
        label: "Terms of Service",
        href: "/terms",
        icon: "description",
    },
    {
        id: "privacy",
        label: "Privacy & Data Protection",
        href: "/privacy",
        icon: "lock",
    },
];

export type LegalLayoutProps = {
    pageKey: string;
    title: string;
    updated: string;
    children: React.ReactNode;
};

const LegalLayout: React.FC<LegalLayoutProps> = ({
    pageKey,
    title,
    updated,
    children,
}) => {
    return (
        <>
            {/* Main content */}
            <section className="font-dmsans max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-x-12">
                {/* Sidebar */}
                <nav className="hidden lg:block lg:col-span-1">
                    <div className="sticky top-32">
                        <h3 className="mb-4 text-sm font-semibold uppercase text-gray-600">
                            Related Policies
                        </h3>
                        <ul className="border-l border-gray-200 pl-4 space-y-4 text-gray-700">
                            {navItems.map((item) => {
                                const isActive = pageKey === item.id;
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={item.href}
                                            className={`flex justify-between items-center ${
                                                isActive
                                                    ? "text-gray-900 font-medium"
                                                    : "hover:text-gray-900"
                                            }`}
                                        >
                                            <span>{item.label}</span>
                                            <span className="material-icons">
                                                {item.icon}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </nav>

                {/* Content */}
                <div className="font-dmsans lg:col-span-3 space-y-6">
                    <h1 className="text-5xl font-bold text-gray-900">
                        {title}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Last updated: {updated}
                    </p>
                    <div className="prose lg:prose-lg max-w-none text-gray-800">
                        {children}
                    </div>
                </div>
            </section>
        </>
    );
};

export default LegalLayout;
