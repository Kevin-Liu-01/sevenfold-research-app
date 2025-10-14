"use client";

export const Problem = () => {
  return (
    <section className="w-full bg-gray-950 flex items-center justify-center px-12 py-20 sm:py-32">
      <div className="mx-auto text-center" style={{ maxWidth: 'var(--max-width-screen)' }}>
        <p className="mb-3 font-dmsans text-sm font-medium uppercase tracking-wide text-orange-500">
          The Problem
        </p>
        <h2 className="mb-8 font-timesnow text-5xl tracking-tight text-white sm:text-6xl">
          Research Is Overwhelming
        </h2>
        <p className="mb-12 mx-auto max-w-3xl font-dmsans text-xl leading-relaxed text-gray-300">
          The explosion of published work and fragmented tools make it harder
          than ever to stay on top of your field.
        </p>
        <div className="grid gap-8 sm:grid-cols-2 max-w-5xl mx-auto">
          <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-10 transition-all hover:border-gray-700 hover:shadow-xl">
            <div className="relative">
              <div className="mb-4 font-dmsans text-7xl font-light tracking-tight text-white">
                59%
              </div>
              <div className="font-dmsans text-lg font-medium text-gray-100">
                Increase in research output
              </div>
              <div className="mt-2 font-dmsans text-sm text-gray-400">
                From 2012 to 2022 — and accelerating
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-10 transition-all hover:border-gray-700 hover:shadow-xl">
            <div className="relative">
              <div className="mb-4 font-dmsans text-7xl font-light tracking-tight text-white">
                8+
              </div>
              <div className="font-dmsans text-lg font-medium text-gray-100">
                Tools per researcher
              </div>
              <div className="mt-2 font-dmsans text-sm text-gray-400">
                Search, read, annotate, write — all disconnected
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
