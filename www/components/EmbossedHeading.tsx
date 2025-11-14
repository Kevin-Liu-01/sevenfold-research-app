import { ReactNode } from "react";

type EmbossedHeadingProps = {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: ReactNode;
};

const baseHaloClass =
  "pointer-events-none absolute inset-0 translate-y-3 rounded-[32px] bg-gradient-to-b from-zinc-700/10 via-zinc-700/3 to-transparent blur-2xl opacity-45";
const topSheenClass =
  "pointer-events-none absolute inset-x-6 top-0 h-1.5 rounded-full bg-white/80 opacity-70 blur-md";
const darkShadowClass =
  "pointer-events-none absolute inset-0 translate-x-[2px] translate-y-[2px] text-transparent [text-shadow:0_3px_8px_rgba(0,0,0,0.18)]";
const lightShadowClass =
  "pointer-events-none absolute inset-0 -translate-x-[2px] -translate-y-[2px] text-transparent [text-shadow:0_-2px_4px_rgba(255,255,255,0.4)]";
const baseTextShadowClass =
  "relative block [text-shadow:0_10px_22px_rgba(15,15,15,0.18),0_-2px_4px_rgba(255,255,255,0.18)]";

export default function EmbossedHeading({
  as = "div",
  className = "",
  children,
}: EmbossedHeadingProps) {
  const Tag = as;
  const classes = ["relative inline-block", className].filter(Boolean).join(" ");

  return (
    <Tag className={classes}>
      <span aria-hidden="true" className={baseHaloClass} />
      <span aria-hidden="true" className={topSheenClass} />
      <span aria-hidden="true" className={darkShadowClass}>
        {children}
      </span>
      <span aria-hidden="true" className={lightShadowClass}>
        {children}
      </span>
      <span className={baseTextShadowClass}>{children}</span>
    </Tag>
  );
}
