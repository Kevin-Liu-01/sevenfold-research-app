import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  GithubIcon,
  InstagramIcon,
  TwitterIcon,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-8">
      <div className="border border-gray-200 p-6 rounded-lg text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Ready to start your research journey?
        </h2>
        <Link
          to="/signup"
          className="inline-block bg-black text-white font-bold px-6 py-2 rounded-lg text-base hover:bg-blue-700 transition"
        >
          Sign up now <ArrowRightIcon size={16} className="inline-block ml-2" />
        </Link>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Ketspen. All rights reserved.
          </div>

          <div className="flex space-x-4 mb-4 md:mb-0">
            <Link to="/terms" className="text-gray-600 hover:text-gray-900">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-gray-600 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900">
              Contact Us
            </Link>
          </div>

          <div className="flex space-x-4 mb-4 md:mb-0">
            <a
              href="https://twitter.com/ketspen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-500"
            >
              <TwitterIcon size={20} />
            </a>
            <a
              href="https://instagram.com/ketspen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-pink-500"
            >
              <InstagramIcon size={20} />
            </a>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              <GithubIcon size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
