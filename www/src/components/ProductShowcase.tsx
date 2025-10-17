"use client";

import Image from "next/image";
export const ProductShowcase = () => {
  return (
    <div className="relative mx-auto p-3" style={{ backgroundImage: "url('/images/bob.jpg')", backgroundSize: "cover", backgroundPosition: "center", maxWidth: 'var(--max-width-screen)' }}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-radial from-orange-500/12 via-transparent to-transparent blur-sm" />
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src="/images/mockups/search-demo.png"
          alt="Sevenfold search demo"
          width={2880}
          height={2160}
          priority
          className="absolute left-2 top-2 h-auto w-3/4 rounded-lg border border-white/5 bg-black/40 object-contain shadow-lg"
        />
        <Image
          src="/images/mockups/chat-demo.png"
          alt="Sevenfold chat demo"
          width={2880}
          height={2160}
          className="absolute bottom-2 right-2 h-auto w-1/2 rounded-lg border border-white/5 bg-black/40 object-contain shadow-lg"
        />
      </div>
    </div>
  );
};
