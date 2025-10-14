"use client";

export const Solution = () => {
  return (
    <section className="w-full bg-gray-950 flex items-center justify-center px-12 py-20 sm:py-32">
      <div className="mx-auto text-center" style={{ maxWidth: 'var(--max-width-screen)' }}>
        <p className="mb-3 font-dmsans text-sm font-medium uppercase tracking-wide text-orange-500">
          The Solution &amp; Features
        </p>
        <h2 className="mb-8 font-timesnow text-5xl tracking-tight text-white sm:text-6xl">
          One Platform, Complete Control
        </h2>
        <p className="mx-auto mb-16 max-w-3xl font-dmsans text-xl leading-relaxed text-gray-300">
          Sevenfold unifies your entire research workflow in one intelligent
          workspace—from discovery to publication.
        </p>
        <div className="grid gap-8 text-left sm:grid-cols-2 lg:grid-cols-3 px-8 sm:px-16">
          {/* Solution Benefits */}
          <div className="group">
            <div className="mb-2 flex items-start gap-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-green-300 font-dmsans text-xs font-bold text-black">
                1
              </div>
              <h3 className="font-dmsans text-2xl font-medium text-white">
                Semantic Search
              </h3>
            </div>
            <p className="font-dmsans text-base leading-snug text-gray-400">
              AI-powered discovery that understands research concepts, not just
              keywords.
            </p>
          </div>
          <div className="group">
            <div className="mb-2 flex items-start gap-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-green-300 font-dmsans text-xs font-bold text-black">
                2
              </div>
              <h3 className="font-dmsans text-2xl font-medium text-white">
                Automated Literature Reviews
              </h3>
            </div>
            <p className="font-dmsans text-base leading-snug text-gray-400">
              Generate comprehensive reviews with AI-synthesized insights and
              gap analysis in hours, not weeks.
            </p>
          </div>
          <div className="group">
            <div className="mb-2 flex items-start gap-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-green-300 font-dmsans text-xs font-bold text-black">
                3
              </div>
              <h3 className="font-dmsans text-2xl font-medium text-white">
                Interactive Research Assistant
              </h3>
            </div>
            <p className="font-dmsans text-base leading-snug text-gray-400">
              Chat with your entire paper library to extract insights and
              compare methodologies instantly.
            </p>
          </div>
          <div className="group">
            <div className="mb-2 flex items-start gap-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-green-300 font-dmsans text-xs font-bold text-black">
                4
              </div>
              <h3 className="font-dmsans text-2xl font-medium text-white">
                AI Writing Assistant
              </h3>
            </div>
            <p className="font-dmsans text-base leading-snug text-gray-400">
              Get intelligent writing suggestions grounded in your research
              library, not generic advice.
            </p>
          </div>
          <div className="group">
            <div className="mb-2 flex items-start gap-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-green-300 font-dmsans text-xs font-bold text-black">
                5
              </div>
              <h3 className="font-dmsans text-2xl font-medium text-white">
                Impact Optimization
              </h3>
            </div>
            <p className="font-dmsans text-base leading-snug text-gray-400">
              AI-powered review analyzes your manuscript for clarity and impact
              before submission.
            </p>
          </div>
          <div className="group">
            <div className="mb-2 flex items-start gap-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-green-300 font-dmsans text-xs font-bold text-black">
                6
              </div>
              <h3 className="font-dmsans text-2xl font-medium text-white">
                Smart Citation Engine
              </h3>
            </div>
            <p className="font-dmsans text-base leading-snug text-gray-400">
              Automatically discover relevant citations and emerging papers as
              you write.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
