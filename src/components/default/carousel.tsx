import React, { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export const Carousel: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <section className="bg-white pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gray-800 text-center text-sm uppercase tracking-wide font-bold mb-6">
          Trusted by Researchers at
        </p>
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition z-10"
            aria-label="Scroll Left"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
          </button>

          {/* Logos container */}
          <div
            ref={scrollRef}
            className="flex space-x-8 overflow-x-auto no-scrollbar px-12"
          >
            {/* Princeton logo */}
            <div className="flex-shrink-0 p-2 w-40 h-20 flex items-center justify-center">
              <img
                src="/images/princeton.png"
                alt="Princeton Logo"
                className="object-contain h-12 "
              />
            </div>
            <div className="flex-shrink-0 p-2 w-40 h-20 flex items-center justify-center">
              <img
                src="/images/caltech.png"
                alt="Caltech Logo"
                className="object-contain h-12 "
              />
            </div>
            <div className="flex-shrink-0 p-2 w-40 h-20 flex items-center justify-center">
              <img
                src="/images/harvard.png"
                alt="Harvard Logo"
                className="object-contain h-12 "
              />
            </div>
            <div className="flex-shrink-0 p-2 w-40 h-20 flex items-center justify-center">
              <img
                src="/images/losalamos.png"
                alt="Los Alamos Labs Logo"
                className="object-contain h-12 "
              />
            </div>
            <div className="flex-shrink-0 p-2 w-40 h-20 flex items-center justify-center">
              <img
                src="/images/at&t.svg"
                alt="AT&T Bell Labs Logo"
                className="object-contain h-12 "
              />
            </div>

            {/* Placeholder gray boxes */}
            {/* <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" /> */}
          </div>

          {/* Right arrow */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition z-10"
            aria-label="Scroll Right"
          >
            <ChevronRightIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
};
