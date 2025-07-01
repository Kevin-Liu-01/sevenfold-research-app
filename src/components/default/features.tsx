import React from "react";

export const Features: React.FC = () => {
  const features = [
    {
      image: "/images/feature-placeholder.png", // placeholder image
      title: "Smart Results Integration",
      description:
        "Drop in your results and notes—Ketspen synthesizes them to identify key findings and recommend applicable papers.",
    },
    {
      image: "/images/feature-placeholder.png", // placeholder image
      title: "Intelligent Annotation Tools",
      description:
        "Highlight, summarize, and annotate with ease—Ketspen auto-detects key findings, links cited papers, and flags relevant sections.",
    },
    {
      image: "/images/feature-placeholder.png", // placeholder image
      title: "Unified Paper Library",
      description:
        "Organize all your research—preprints, journals, annotations, and notes—in a single, searchable workspace.",
    },
    {
      image: "/images/feature-placeholder.png", // placeholder image
      title: "Researcher-Informed Semantic Search",
      description:
        "Discover the most impactful papers—Ketspen surfaces results based on what top researchers read, highlight, and cite.",
    },
    {
      image: "/images/feature-placeholder.png", // placeholder image
      title: "AI-Powered Writing & Auto-Citation",
      description:
        "Write faster with smart suggestions, real-time citations, and seamless integration with your reading history and library.",
    },
    {
      image: "/images/feature-placeholder.png", // placeholder image
      title: "Chat with Your Corpus",
      description:
        "Converse with your entire paper library—ask questions, trace arguments, and extract insights instantly from papers, notes, and annotations.",
    },
  ];

  return (
    <section id="features" className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            The Research Stack, Rebuilt
          </h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            Replace scattered, inefficient tools with Ketspen's unified platform—designed to streamline every step of your research process and help you move faster, think deeper, and publish smarter.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-start text-left p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback for placeholder image
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
                <div className="w-full h-full bg-gray-200 rounded-lg items-center justify-center text-gray-500 text-sm hidden">
                  Feature Image
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};