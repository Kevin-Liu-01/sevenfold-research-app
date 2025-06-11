import React, { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { Link } from "react-router-dom";
// import { GlobeAltIcon } from "@heroicons/react/24/outline";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="max-w-7xl mx-auto w-full bg-white z-50">
      {/* Launch Banner */}
      <div className="rounded-full mx-8 mt-6 bg-gray-200 text-center text-sm py-2 font-medium text-gray-700">
        We’ve Launched! Effective Sept 1, 2025, Ketspen Beta Will Be Open to
        Users.
      </div>
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Ketspen logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-2xl flex items-center font-bold text-gray-800"
            >
              {/* <GlobeAltIcon
                className="inline-block h-8 w-8 mr-2
              "
              />
              Ketspen */}
              <img
                src="/images/Ketspen_logo.png"
                className="h-12 "
                alt="Ketspen Logo"
              />
            </Link>
          </div>

          {/* Center: Nav Links */}
          <div className="hidden md:flex text-sm space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              Features
            </a>
            <Link
              to="/pricing"
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              Pricing
            </Link>
            <Link
              to="/company"
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              Company
            </Link>
          </div>

          {/* Right: CTA Buttons / Mobile Hamburger */}
          <div className="flex items-center space-x-4">
            <Link
              to="/signup"
              className="hidden md:inline-block bg-black text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="hidden md:inline-block text-black font-semibold px-4 py-2 border border-black rounded-lg hover:bg-gray-50 transition"
            >
              Login
            </Link>

            {/* Mobile menu toggle button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label={isOpen ? "Close menu" : "Open menu"}
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

      {/* Mobile menu panel (always in DOM to allow slide animation) */}
      <div
        className={`md:hidden border-b pb-4 fixed inset-x-0 top-0 bg-white z-40 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="px-4 pt-6 flex flex-col space-y-6">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-600 ml-auto hover:text-gray-900 focus:outline-none"
            aria-label="Close menu"
          >
            <XIcon className="h-6 w-6" />
          </button>
          <a
            href="#features"
            onClick={() => setIsOpen(false)}
            className="text-gray-700 hover:text-gray-900 font-medium text-lg transition"
          >
            Features
          </a>
          <Link
            to="/pricing"
            onClick={() => setIsOpen(false)}
            className="text-gray-700 hover:text-gray-900 font-medium text-lg transition"
          >
            Pricing
          </Link>
          <Link
            to="/company"
            onClick={() => setIsOpen(false)}
            className="text-gray-700 hover:text-gray-900 font-medium text-lg transition"
          >
            Company
          </Link>
          <Link
            to="/signup"
            onClick={() => setIsOpen(false)}
            className="inline-block bg-black mb-3 text-white font-semibold px-4 py-2 rounded-lg text-center hover:bg-gray-800 transition"
          >
            Sign Up
          </Link>
          <Link
            to="/login"
            onClick={() => setIsOpen(false)}
            className="inline-block text-black font-semibold px-4 py-2 border border-black rounded-lg text-center hover:bg-gray-50 transition"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};
