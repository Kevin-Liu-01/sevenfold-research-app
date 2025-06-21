import React from "react";

export const Carousel: React.FC = () => {
  const logos = [
    { src: "/images/princeton.png", href: "https://www.princeton.edu" },
    { src: "/images/caltech.png", href: "https://www.caltech.edu" },
    { src: "/images/harvard.png", href: "https://www.harvard.edu" },
    { src: "/images/losalamos.png", href: "https://www.lanl.gov" },
    { src: "/images/at&t.svg", href: "https://www.att.com" },
  ];

  const allLogos = [...logos, ...logos]; // Duplicate for seamless scroll

  return (
    <section className="bg-white py-8">
      <p className="text-gray-800 text-center text-sm uppercase tracking-wide font-bold mb-6">
        Trusted by Researchers at
      </p>
      <div className="relative overflow-hidden max-w-6xl mx-auto h-[100px] slider-mask">
        <div className="flex w-[3500px] animate-scroll">
          {allLogos.map(({ src, href }, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-[100px] w-[250px]"
            >
              <a href={href} target="_blank" rel="noopener noreferrer">
                <img
                  src={src}
                  alt={`Logo ${index}`}
                  className="h-[60px] object-contain mx-auto transition-opacity hover:opacity-80"
                />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
