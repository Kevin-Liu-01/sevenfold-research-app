import { type ElementType, type ReactNode } from "react";

type EmbossedHeadingProps = {
  as?: ElementType;              // no JSX.IntrinsicElements needed
  className?: string;
  children: ReactNode;
};

const baseHaloClass =
  "pointer-events-none absolute inset-0 translate-y-3 rounded-[32px] bg-gradient-to-b from-zinc-700/10 via-zinc-700/3 to-transparent blur-xl opacity-25";
const topSheenClass =
  "pointer-events-none absolute inset-x-6 top-0 h-1.5 rounded-full bg-white/80 opacity-50 blur-sm";
const darkShadowClass =
  "pointer-events-none absolute inset-0 translate-x-[1px] translate-y-[1px] text-transparent [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]";
const lightShadowClass =
  "pointer-events-none absolute inset-0 -translate-x-[1px] -translate-y-[1px] text-transparent [text-shadow:0_-1px_2px_rgba(255,255,255,0.2)]";
const baseTextShadowClass =
  "relative block [text-shadow:0_4px_8px_rgba(15,15,15,0.1),0_-1px_2px_rgba(255,255,255,0.1)]";

export default function EmbossedHeading({
  as = "div",
  className = "",
  children,
}: EmbossedHeadingProps) {
  const Tag = as as ElementType;
  const classes = ["relative inline-block", "font-diatype", className].filter(Boolean).join(" ");

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
