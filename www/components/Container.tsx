import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({ children, className = "" }: ContainerProps) {
  return (
    <div
      className={["mx-auto max-w-[var(--site-maxw)] px-[var(--site-pad)]", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
