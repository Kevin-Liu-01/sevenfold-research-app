import Link from "next/link";
import { ComponentProps } from "react";

const baseStyles =
  "inline-flex items-center justify-center rounded-2xl border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const variantStyles: Record<"solid" | "ghost" | "accent", string> = {
  solid: "bg-zinc-900 text-white border-transparent hover:bg-zinc-800 active:bg-zinc-900",
  ghost:
    "bg-transparent text-foreground border-zinc-300 hover:bg-zinc-200/80 active:bg-zinc-300",
  accent:
    "border-transparent bg-accent text-white hover:bg-[#df6c1d] active:bg-[#c55f19]",
};

const sizeStyles: Record<"sm" | "md" | "lg", string> = {
  sm: "h-7 px-3 text-sm",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "solid" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
};

export function ButtonLink({
  variant = "solid",
  size = "md",
  className = "",
  ...props
}: ButtonLinkProps) {
  const classes = [baseStyles, variantStyles[variant], sizeStyles[size], className]
    .filter(Boolean)
    .join(" ");

  return <Link className={classes} {...props} />;
}
