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
    <section className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-center text-gray-600 uppercase tracking-wider mb-6">
          Trusted By
        </h3>
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
            className="flex space-x-8 overflow-x-auto scrollbar-hide px-12"
          >
            {/* Princeton logo */}
            <div className="flex-shrink-0 w-40 h-20 flex items-center justify-center">
              <img
                src="data:image/png;base64,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"
                alt="Princeton Logo"
                className="object-contain h-12 "
              />
            </div>

            {/* Placeholder gray boxes */}
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />

            <div className="flex-shrink-0 w-40 h-20 bg-gray-200 rounded-lg" />
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
