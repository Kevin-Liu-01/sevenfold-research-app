// import { ArrowRightIcon, UserIcon } from "lucide-react";
import React from "react";

export const Hero: React.FC = () => {
  return (
    <section className="bg-white overflow-hidden">
      {/* Header & Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        {/* Main heading and subtext */}
        <div className="text-left mx-auto mb-10">
          <h1 className="text-4xl font-light font-hedvig sm:text-5xl font-serif text-gray-900 leading-tight">
            Every Part of Your Research Workflow, <br />
            In One Agentic Environment.
          </h1>
          <p className="text-3xl font-light max-w-3xl text-gray-700 mt-6">
            Ketspen helps you find, digest, and produce research in one
            centralized workplace, using project-aware intelligence to eliminate
            paper-chasing.
          </p>
          <div className="mt-8">
            <a
              href="#"
              className="inline-block bg-black text-white font-light px-3 py-2 rounded-lg text-lg hover:bg-gray-800 transition"
            >
              Get Started Now{" "}
              {/* <ArrowRightIcon size={18} className="inline-block ml-2" /> */}
            </a>
          </div>
        </div>

        {/* Mockup Workspace Section */}
        <div className="rounded-3xl border-2 border-gray-200 overflow-hidden shadow-inner">
          <img
            src="/images/mockup.webp"
            alt="Research interface mockup"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
};

// <section className="bg-gray-50 overflow-hidden">
//   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:flex lg:items-start lg:justify-between relative">
//     {/* Left: Hero Text + CTA */}
//     <div className="lg:w-1/2 text-center flex items-center sm:items-start flex-col my-auto lg:text-left space-y-6 z-10">
//       <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900">
//         Your Research,{" "}
//         <span className="bg-gradient-to-r pb-2 from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">
//           Supercharged
//         </span>
//       </h1>
//       <p className="text-lg sm:text-xl text-gray-600 max-w-lg">
//         Discover, organize, and annotate academic papers all in one
//         place—powered by AI insights so you can focus on what matters most.
//       </p>
//       <a
//         href="/signup"
//         className="inline-block w-min truncate bg-black text-white font-semibold px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition"
//       >
//         Get Started Free{" "}
//         <ArrowRightIcon size={20} className="inline-block ml-2" />
//       </a>
//     </div>

//     {/* Right: Wide, Clipped Paper “Cards” with Enhanced Slide & Angles */}
//     <div className="lg:w-1/2 mt-12 pl-8 lg:mt-0 rotate-3 flex justify-center">
//       <div className="relative w-[24rem] h-[28rem]">
//         {/* Card 1 (front) */}
//         <div className="group absolute top-0 left-[-6rem] w-[24rem] h-[35rem] hover:translate-x-[-4rem] bg-white shadow-2xl rounded-lg transform -rotate-15 hover:-rotate-20 transition-transform duration-500">
//           <div className="p-6 space-y-4">
//             <h2 className="text-xl font-semibold text-gray-800">
//               Lorem Ipsum Dolor Sit Amet
//             </h2>
//             <p className="text-gray-400 text-sm leading-relaxed">
//               Consectetur adipiscing elit, sed do eiusmod tempor incididunt
//               ut labore et dolore magna aliqua. Ut enim ad minim veniam,
//               quis nostrud exercitation ullamco laboris nisi ut aliquip ex
//               ea commodo consequat.
//             </p>
//             <p className="text-gray-700 text-sm leading-relaxed">
//               Lorem ipsum dolor sit amet, consectetur adipiscing elit.{" "}
//               <span className="relative group">
//                 <div className="hover:rotate-15 transition-all absolute top-0 border border-black/40 mr-2 right-full ml-2 w-32 p-2 bg-white text-xs text-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100">
//                   <div className="font-semibold truncate">
//                     <UserIcon size={16} className=" inline-block mr-1" />
//                     A’s insight
//                   </div>
//                   <div className="mt-1 text-xs text-gray-500">
//                     This is a note about the text.
//                   </div>
//                 </div>
//                 <span className="bg-red-200">Vivamus luctus</span>
//               </span>{" "}
//               urna sed bibendum fringilla. Cras quis tortor nec velit
//               aliquet feugiat.
//             </p>
//             <p className="text-gray-700 text-sm leading-relaxed">
//               In hac habitasse platea dictumst.{" "}
//               <span className="relative group">
//                 <span className="bg-yellow-200">Fusce nec</span>
//                 <div className="absolute top-0 left-full ml-2 w-32 p-2 bg-white text-xs text-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
//                   Annotation note
//                 </div>
//               </span>{" "}
//               tellus et mauris vehicula mollis. Integer vitae justo nec
//               purus luctus.
//             </p>

//             <p className="text-gray-400 text-sm leading-relaxed">
//               Duis aute irure dolor in reprehenderit in voluptate velit esse
//               cillum dolore eu fugiat nulla pariatur. Excepteur sint
//               occaecat cupidatat non proident, sunt in culpa qui officia
//               deserunt mollit anim id est laborum.
//             </p>
//           </div>
//         </div>

//         {/* Card 2 (middle, slid further right) */}
//         <div className="group absolute top-8 w-[24rem] h-[35rem] bg-white shadow-2xl rounded-lg transform -rotate-10 hover:-rotate-15 hover:translate-x-[-4rem] transition-transform duration-500">
//           <div className="p-6 space-y-4">
//             <h2 className="text-xl font-semibold text-gray-800">
//               Lorem Ipsum Dolor Sit Amet B
//             </h2>
//             <p className="text-gray-700 text-sm leading-relaxed">
//               Sed do eiusmod tempor incididunt ut labore et dolore magna
//               aliqua.{" "}
//               <span className="relative group">
//                 <div className="hover:rotate-12 transition-all absolute top-0 border border-black/40 mr-2 right-full ml-2 w-32 p-2 bg-white text-xs text-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100">
//                   <div className="font-semibold truncate">
//                     <UserIcon size={16} className=" inline-block mr-1" />
//                     B’s insight
//                   </div>
//                   <div className="mt-1 text-xs text-gray-500">
//                     This is a note about the text.
//                   </div>
//                 </div>
//                 <span className="bg-red-200">Ut enim ad minim</span>
//               </span>{" "}
//               veniam, quis nostrud exercitation ullamco laboris nisi ut
//               aliquip ex ea commodo consequat.
//             </p>

//             <p className="text-gray-700 text-sm leading-relaxed">
//               Duis aute irure dolor in reprehenderit in voluptate velit esse{" "}
//               <span className="relative group">
//                 <div className="hover:rotate-12 transition-all absolute top-0 border border-black/40 mr-2 right-full ml-2 w-32 p-2 bg-white text-xs text-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100">
//                   <div className="font-semibold truncate">
//                     <UserIcon size={16} className=" inline-block mr-1" />
//                     C’s insight
//                   </div>
//                   <div className="mt-1 text-xs text-gray-500">
//                     Insight here.
//                   </div>
//                 </div>
//                 <span className="bg-green-200">cillum dolore</span>
//               </span>{" "}
//               eu fugiat nulla pariatur.
//             </p>
//             <p className="text-gray-400 text-sm leading-relaxed">
//               Duis aute irure dolor in reprehenderit in voluptate velit esse
//               cillum dolore eu fugiat nulla pariatur. Excepteur sint
//               occaecat cupidatat non proident, sunt in culpa qui officia
//               deserunt mollit anim id est laborum.
//             </p>
//             <p className="text-gray-400 text-sm leading-relaxed">
//               Consectetur adipiscing elit, sed do eiusmod tempor incididunt
//               ut labore et dolore magna aliqua. Ut enim ad minim veniam,
//               quis nostrud exercitation ullamco laboris nisi ut aliquip ex
//               ea commodo consequat.
//             </p>
//           </div>
//         </div>

//         {/* Card 3 (back, slid even further right) */}
//         <div className="group absolute top-16 left-24 w-[24rem] h-[35rem] bg-white shadow-2xl rounded-lg transform -rotate-5 hover:-rotate-10 hover:translate-x-[-2rem] transition-transform duration-500">
//           <div className="p-6 space-y-4">
//             <h2 className="text-xl font-semibold text-gray-800">
//               Lorem Ipsum Dolor Sit Amet C
//             </h2>
//             <p className="text-gray-700 text-sm leading-relaxed">
//               Excepteur sint occaecat cupidatat non proident, sunt in culpa{" "}
//               <span className="relative group">
//                 <span className="bg-yellow-200">qui officia deserunt</span>
//                 <div className="hover:rotate-7 transition-all absolute top-0 border border-black/40 mr-2 left-full ml-2 w-32 p-2 bg-white text-xs text-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100">
//                   <div className="font-semibold truncate">
//                     <UserIcon size={16} className=" inline-block mr-1" />
//                     A’s insight
//                   </div>
//                   <div className="mt-1 text-xs text-gray-500">
//                     This is a note about the text.
//                   </div>
//                 </div>
//               </span>{" "}
//               mollit anim id est laborum.
//             </p>
//             <p className="text-gray-700 text-sm leading-relaxed">
//               Curabitur pretium tincidunt lacus. Nulla gravida orci a odio.{" "}
//               <span className="relative group">
//                 <span className="bg-blue-200">Nullam varius</span>
//                 <div className="hover:rotate-7 transition-all absolute top-0 border border-black/40 mr-2 left-full ml-2 w-32 p-2 bg-white text-xs text-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100">
//                   <div className="font-semibold truncate">
//                     <UserIcon size={16} className=" inline-block mr-1" />
//                     D’s insight
//                   </div>
//                   <div className="mt-1 text-xs text-gray-500">
//                     This is a note about the text.
//                   </div>
//                 </div>
//               </span>{" "}
//               in elementum orci sodales.
//             </p>
//             <p className="text-gray-400 text-sm leading-relaxed">
//               Consectetur adipiscing elit, sed do eiusmod tempor incididunt
//               ut labore et dolore magna aliqua. Ut enim ad minim veniam,
//               quis nostrud exercitation ullamco laboris nisi ut aliquip ex
//               ea commodo consequat. Duis aute irure dolor in reprehenderit
//               in voluptate velit esse cillum dolore eu fugiat nulla
//               pariatur. Excepteur sint occaecat cupidatat non proident, sunt
//               in culpa qui officia deserunt mollit anim id est laborum.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// </section>
