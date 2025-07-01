import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-8" role="contentinfo" aria-label="Site footer">
      {/* CTA Section - Keep existing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border border-gray-200 p-6 rounded-lg text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Ready to start your research journey?
          </h2>
          <Link
            to="/signup"
            className="inline-block bg-black text-white font-bold px-6 py-2 rounded-lg text-base hover:bg-blue-700 transition"
            aria-label="Sign up for Ketspen research platform"
          >
            Sign up now <ArrowRightIcon size={16} className="inline-block ml-2" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* New 6-Column Footer Section with Gradient Background */}
      <div 
        className="text-white"
        style={{ 
          background: 'linear-gradient(135deg, #f57920 0%, #ffbd59 50%, #7ed957 100%)' 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="grid grid-cols-2 md:grid-cols-6 gap-8" aria-label="Footer navigation">
            
            {/* Column 1: RESOURCES */}
            <div className="col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">RESOURCES</h3>
              <ul className="space-y-2" role="list">
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">User Guide</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Changelog</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">FAQs</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Community</a></li>
              </ul>
            </div>

            {/* Column 2: LEGAL */}
            <div className="col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">LEGAL</h3>
              <ul className="space-y-2" role="list">
                <li><Link to="/terms" className="text-white/80 hover:text-white text-sm transition">Terms</Link></li>
                <li><Link to="/privacy" className="text-white/80 hover:text-white text-sm transition">Privacy</Link></li>
              </ul>
            </div>

            {/* Column 3: PRODUCT */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">PRODUCT</h3>
              <ul className="space-y-2" role="list">
                <li><a href="#features" className="text-white/80 hover:text-white text-sm transition">Features</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Testimonials</a></li>
                <li><Link to="/pricing" className="text-white/80 hover:text-white text-sm transition">Pricing</Link></li>
                <li><Link to="/signup" className="text-white/80 hover:text-white text-sm transition">Sign Up</Link></li>
                <li><Link to="/home" className="text-white/80 hover:text-white text-sm transition">Web App</Link></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Mobile App</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Desktop App</a></li>
              </ul>
            </div>

            {/* Column 4: COMPANY */}
            <div className="col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">COMPANY</h3>
              <ul className="space-y-2" role="list">
                <li><Link to="/company" className="text-white/80 hover:text-white text-sm transition">About Us</Link></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Careers</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Team</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Blog</a></li>
                <li><Link to="/contact" className="text-white/80 hover:text-white text-sm transition">Contact</Link></li>
              </ul>
            </div>

            {/* Column 5: SOCIALS */}
            <div className="col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">SOCIALS</h3>
              <ul className="space-y-2" role="list">
                <li><a href="https://linkedin.com/company/ketspen" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-sm transition" aria-label="Follow Ketspen on LinkedIn">LinkedIn</a></li>
                <li><a href="https://twitter.com/ketspen" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-sm transition" aria-label="Follow Ketspen on X (Twitter)">X (Twitter)</a></li>
              </ul>
            </div>

            {/* Column 6: LOGO & COPYRIGHT - Right Aligned and Slightly Wider */}
            <div className="col-span-2 md:col-span-1 md:text-right flex flex-col justify-between">
              <div className="mb-4">
                <img 
                  src="/branding/logo-long.png" 
                  alt="Ketspen company logo" 
                  className="h-8 md:ml-auto filter brightness-0 invert"
                />
              </div>
              <div className="text-white/80 text-sm">
                © 2025 Ketspen Inc.
              </div>
            </div>

          </nav>
        </div>
      </div>
    </footer>
  );
};
