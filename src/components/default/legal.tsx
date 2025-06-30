import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
const navItems = [
  // { id: "overview", label: "Legal overview", href: "/legal" },
  {
    id: "user",
    label: "Terms of Service",
    href: "/terms",
    icon: "description",
  },
  // {
  //   id: "enterprise",
  //   label: "Enterprise & Developer Terms",
  //   href: "/legal/enterprise-terms",
  // },
  // { id: "policies", label: "Policies & Guidelines", href: "/legal/policies" },
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
      <Navbar />

      {/* Hero */}
      <section className="font-timesnow bg-orange-400/50">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="font-bold text-5xl text-gray-900">
            Ketspen Legal Hub
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Information related to our terms of service, policies, intellectual
            property, and compliance.
          </p>
        </div>
      </section>

      {/* Sidebar + Content */}
      <section className="font-timesnow max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-x-12">
        <nav className="hidden lg:block sticky top-24">
          <ul className="border-l border-gray-200 pl-4 space-y-4 text-gray-700">
            {navItems.map((item) => {
              const isActive = pageKey === item.id;
              return (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className={`flex justify-between items-center ${
                      isActive
                        ? "text-gray-900 font-medium"
                        : "hover:text-gray-900"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="material-icons">{item.icon}</span>
                    {/* <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg> */}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="font-timesnow lg:col-span-3 space-y-6">
          <h2 className="text-3xl text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">Last updated: {updated}</p>
          <div className="flex flex-col gap-4 prose lg:prose-lg max-w-none text-gray-800">
            {children}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default LegalLayout;
