"use client";

import { useEffect, useRef, useState } from "react";
import faqs from "@/data/faqs.json";
import Container from "./Container";
import EmbossedHeading from "./EmbossedHeading";

type Faq = {
  question: string;
  answer: string;
};

function FaqItem({ question, answer }: Faq) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }
    const updateHeight = () => setContentHeight(node.scrollHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [answer]);

  const maxHeight = open ? contentHeight : 0;

  return (
    <div className="border-b border-zinc-200 px-2 py-6 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 text-left text-xl font-semibold text-foreground"
        aria-expanded={open}
      >
        <span>{question}</span>
        <span
          className="text-accent transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        className="overflow-hidden text-base text-zinc-600 transition-[max-height,opacity] duration-300 ease-out"
        style={{ maxHeight, opacity: open ? 1 : 0 }}
      >
        <div ref={contentRef} className="pt-3">
          {answer}
        </div>
      </div>
    </div>
  );
}

export default function Faqs() {
  const faqItems = faqs as Faq[];
  return (
    <section className="py-20">
      <Container className="grid gap-12 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
        <div className="flex flex-col gap-4 max-w-md">
          <p className="inline-flex w-fit items-center rounded-full border border-accent bg-accent px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-background">
            FAQs
          </p>
          <EmbossedHeading
            as="h2"
            className="text-3xl font-semibold tracking-tight text-zinc-700 sm:text-4xl"
          >
            Have Questions?
          </EmbossedHeading>
          <p className="text-sm text-zinc-600">
            Everything founders, research leads, and ops teams typically ask before going live.
          </p>
        </div>
        <div className="border-t border-b border-zinc-200">
          {faqItems.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </Container>
    </section>
  );
}
