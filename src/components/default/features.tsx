import React from "react";
import {
  SearchIcon,
  FileTextIcon,
  LayersIcon,
  UsersIcon,
  BookOpenIcon,
} from "lucide-react";

export const Features: React.FC = () => {
  const features = [
    {
      icon: <SearchIcon className="h-8 w-8 text-black" />,
      title: "Smart Search",
      description:
        "Quickly find exactly the papers you need with AI‑powered filters and relevance ranking.",
    },
    {
      icon: <LayersIcon className="h-8 w-8 text-black" />,
      title: "Tailored Follow‑Up Papers",
      description:
        "Get personalized recommendations for related articles based on your reading history.",
    },
    {
      icon: <FileTextIcon className="h-8 w-8 text-black" />,
      title: "Smart Summaries",
      description:
        "Automatically generate concise summaries of lengthy papers so you can grasp key points instantly.",
    },
    {
      icon: <UsersIcon className="h-8 w-8 text-black" />,
      title: "See What Others Read",
      description:
        "Discover which papers your colleagues and peers are spending time on to stay in ‑tune with trends.",
    },
    {
      icon: <BookOpenIcon className="h-8 w-8 text-black" />,
      title: "Smart Citations",
      description:
        "Auto‑format and insert citations with AI assistance, ensuring accuracy and saving you time.",
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
          Key Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="bg-white p-4 rounded-full mb-4">
                {feature.icon}
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h4>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
