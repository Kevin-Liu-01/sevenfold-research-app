import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";

// Footer with dark solid background
export const FooterDark: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-8">
      {/* CTA Section - Keep existing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </div>

      {/* Dark Background Footer */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            
            {/* Column 1: RESOURCES */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">RESOURCES</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">User Guide</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">Changelog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">FAQs</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">Community</a></li>
              </ul>
            </div>

            {/* Column 2: LEGAL */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">LEGAL</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-gray-300 hover:text-white text-sm transition">Terms</Link></li>
                <li><Link to="/privacy" className="text-gray-300 hover:text-white text-sm transition">Privacy</Link></li>
              </ul>
            </div>

            {/* Column 3: PRODUCT */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">PRODUCT</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-300 hover:text-white text-sm transition">Features</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">Testimonials</a></li>
                <li><Link to="/pricing" className="text-gray-300 hover:text-white text-sm transition">Pricing</Link></li>
                <li><Link to="/signup" className="text-gray-300 hover:text-white text-sm transition">Sign Up</Link></li>
                <li><Link to="/home" className="text-gray-300 hover:text-white text-sm transition">Web App</Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">Mobile App</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">Desktop App</a></li>
              </ul>
            </div>

            {/* Column 4: COMPANY */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">COMPANY</h3>
              <ul className="space-y-2">
                <li><Link to="/company" className="text-gray-300 hover:text-white text-sm transition">About Us</Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">Team</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition">Blog</a></li>
                <li><Link to="/contact" className="text-gray-300 hover:text-white text-sm transition">Contact</Link></li>
              </ul>
            </div>

            {/* Column 5: SOCIALS */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">SOCIALS</h3>
              <ul className="space-y-2">
                <li><a href="https://linkedin.com/company/ketspen" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm transition">LinkedIn</a></li>
                <li><a href="https://twitter.com/ketspen" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm transition">X (Twitter)</a></li>
              </ul>
            </div>

            {/* Column 6: LOGO & COPYRIGHT - Right Aligned */}
            <div className="md:col-span-1 md:text-right">
              <div className="mb-4">
                <img 
                  src="/branding/logo-long.png" 
                  alt="Ketspen Logo" 
                  className="h-8 md:ml-auto"
                />
              </div>
              <div className="text-gray-300 text-sm">
                © 2025 Ketspen Inc.
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

// Footer with Ketspen Orange background
export const FooterOrange: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-8">
      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </div>

      {/* Orange Background Footer */}
      <div style={{ backgroundColor: '#f57920' }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            
            {/* Column 1: RESOURCES */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">RESOURCES</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">User Guide</a></li>
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">Changelog</a></li>
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">FAQs</a></li>
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">Community</a></li>
              </ul>
            </div>

            {/* Column 2: LEGAL */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">LEGAL</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-orange-100 hover:text-white text-sm transition">Terms</Link></li>
                <li><Link to="/privacy" className="text-orange-100 hover:text-white text-sm transition">Privacy</Link></li>
              </ul>
            </div>

            {/* Column 3: PRODUCT */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">PRODUCT</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-orange-100 hover:text-white text-sm transition">Features</a></li>
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">Testimonials</a></li>
                <li><Link to="/pricing" className="text-orange-100 hover:text-white text-sm transition">Pricing</Link></li>
                <li><Link to="/signup" className="text-orange-100 hover:text-white text-sm transition">Sign Up</Link></li>
                <li><Link to="/home" className="text-orange-100 hover:text-white text-sm transition">Web App</Link></li>
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">Mobile App</a></li>
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">Desktop App</a></li>
              </ul>
            </div>

            {/* Column 4: COMPANY */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">COMPANY</h3>
              <ul className="space-y-2">
                <li><Link to="/company" className="text-orange-100 hover:text-white text-sm transition">About Us</Link></li>
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">Careers</a></li>
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">Team</a></li>
                <li><a href="#" className="text-orange-100 hover:text-white text-sm transition">Blog</a></li>
                <li><Link to="/contact" className="text-orange-100 hover:text-white text-sm transition">Contact</Link></li>
              </ul>
            </div>

            {/* Column 5: SOCIALS */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">SOCIALS</h3>
              <ul className="space-y-2">
                <li><a href="https://linkedin.com/company/ketspen" target="_blank" rel="noopener noreferrer" className="text-orange-100 hover:text-white text-sm transition">LinkedIn</a></li>
                <li><a href="https://twitter.com/ketspen" target="_blank" rel="noopener noreferrer" className="text-orange-100 hover:text-white text-sm transition">X (Twitter)</a></li>
              </ul>
            </div>

            {/* Column 6: LOGO & COPYRIGHT - Right Aligned */}
            <div className="md:col-span-1 md:text-right">
              <div className="mb-4">
                <img 
                  src="/branding/logo-long.png" 
                  alt="Ketspen Logo" 
                  className="h-8 md:ml-auto"
                />
              </div>
              <div className="text-orange-100 text-sm">
                © 2025 Ketspen Inc.
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

// Footer with gradient background using brand colors
export const FooterGradient: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-8">
      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </div>

      {/* Gradient Background Footer */}
      <div 
        className="text-white"
        style={{ 
          background: 'linear-gradient(135deg, #f57920 0%, #ffbd59 50%, #7ed957 100%)' 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            
            {/* Column 1: RESOURCES */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">RESOURCES</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">User Guide</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Changelog</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">FAQs</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Community</a></li>
              </ul>
            </div>

            {/* Column 2: LEGAL */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">LEGAL</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-white/80 hover:text-white text-sm transition">Terms</Link></li>
                <li><Link to="/privacy" className="text-white/80 hover:text-white text-sm transition">Privacy</Link></li>
              </ul>
            </div>

            {/* Column 3: PRODUCT */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">PRODUCT</h3>
              <ul className="space-y-2">
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
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">COMPANY</h3>
              <ul className="space-y-2">
                <li><Link to="/company" className="text-white/80 hover:text-white text-sm transition">About Us</Link></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Careers</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Team</a></li>
                <li><a href="#" className="text-white/80 hover:text-white text-sm transition">Blog</a></li>
                <li><Link to="/contact" className="text-white/80 hover:text-white text-sm transition">Contact</Link></li>
              </ul>
            </div>

            {/* Column 5: SOCIALS */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">SOCIALS</h3>
              <ul className="space-y-2">
                <li><a href="https://linkedin.com/company/ketspen" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-sm transition">LinkedIn</a></li>
                <li><a href="https://twitter.com/ketspen" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-sm transition">X (Twitter)</a></li>
              </ul>
            </div>

            {/* Column 6: LOGO & COPYRIGHT - Right Aligned */}
            <div className="md:col-span-1 md:text-right">
              <div className="mb-4">
                <img 
                  src="/branding/logo-long.png" 
                  alt="Ketspen Logo" 
                  className="h-8 md:ml-auto filter brightness-0 invert"
                />
              </div>
              <div className="text-white/80 text-sm">
                © 2025 Ketspen Inc.
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};