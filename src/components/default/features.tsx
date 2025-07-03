// src/components/default/Features.tsx
import React from "react";

export const Features: React.FC = () => (
  <section className="max-w-6xl mx-auto px-4 py-12 font-dmsans">
    {/* HEADER */}
    <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-4">
      The Research Stack, Rebuilt
    </h2>
    <p className="text-base text-gray-600 text-center mb-10">
      Replace scattered, inefficient tools with Ketspen’s unified
      platform—streamline every step of your research process to move faster,
      think deeper, and publish smarter.
    </p>

    {/* GRID: 1col default → 3cols at md */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Row 1: Wide, then Narrow */}
      <div className="overflow-hidden relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm md:col-span-2">
        {/* text block at 40% */}
        <div className="w-[40%] text-left">
          <h3 className="text-sm font-medium mb-1">
            Smart Results Integration
          </h3>
          <p className="text-xs">
            Drop in your results and notes—Ketspen synthesizes them to identify
            key findings and recommend applicable papers.
          </p>
        </div>
        {/* image placeholder at 40% */}
        <img
          src="/images/pdfviewer-mockup.png"
          alt="Smart Results Integration"
          className="mt-4 absolute shadow-lg h-[100%] w-auto right-0 bg-gray-200 rounded-lg"
        />
      </div>

      <div className="relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm">
        {/* text at 70% */}
        <div className="w-[70%] text-left">
          <h3 className="text-sm font-medium mb-1">
            Intelligent Annotation Tools
          </h3>
          <p className="text-xs">
            Highlight, summarize and annotate with ease—auto-detect key
            findings, link cited papers and flag relevant sections.
          </p>
        </div>
        <img
          src="/images/pdfviewer-mockup.png"
          alt="Intelligent Annotation Tools"
          className="mt-4 h-auto w-auto bg-gray-200 rounded-lg"
        />
      </div>

      {/* Row 2: Narrow, then Wide */}
      <div className="relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm">
        <div className="w-[70%] text-left">
          <h3 className="text-sm font-medium mb-1">Unified Paper Library</h3>
          <p className="text-xs">
            Organize preprints, journals, notes and annotations in a single,
            searchable workspace.
          </p>
        </div>
        <img
          src="/images/search-mockup.png"
          alt="Unified Paper Library"
          className="mt-4 h-auto w-auto bg-gray-200 rounded-lg"
        />
      </div>

      <div className="overflow-hidden relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm md:col-span-2">
        <div className="w-[40%] text-left">
          <h3 className="text-sm font-medium mb-1">
            Researcher-Informed Semantic Search
          </h3>
          <p className="text-xs">
            Surface the most impactful papers—Ketspen learns from top
            researchers’ reads, highlights and citations.
          </p>
        </div>
        <img
          src="/images/search-mockup.png"
          alt="Researcher-Informed Semantic Search"
          className="mt-4 absolute shadow-lg h-[100%] w-auto right-0 bg-gray-200 rounded-lg"
        />
      </div>

      {/* Row 3: Wide, then Narrow */}
      <div className="relative overflow-hidden bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm md:col-span-2">
        <div className="w-[40%] text-left">
          <h3 className="text-sm font-medium mb-1">
            AI-Powered Writing & Auto-Citation
          </h3>
          <p className="text-xs">
            Write faster with smart suggestions, real-time citations and
            seamless library integration.
          </p>
        </div>
        <img
          src="/images/chatbot-mockup.png"
          alt="AI-Powered Writing & Auto-Citation"
          className="mt-4 absolute shadow-lg h-[100%] w-auto right-0 bg-gray-200 rounded-lg"
        />
      </div>

      <div className="relative bg-gray-50 rounded-2xl p-5 text-gray-800 text-sm">
        <div className="w-[70%] text-left">
          <h3 className="text-sm font-medium mb-1">Chat with Your Corpus</h3>
          <p className="text-xs">
            Converse with your entire paper library—ask questions, trace
            arguments and extract insights instantly.
          </p>
        </div>
        <img
          src="/images/chatbot-mockup.png"
          alt="Chat with Your Corpus"
          className="mt-4 bg-gray-200 rounded-lg"
        />
      </div>
    </div>
  </section>
);
