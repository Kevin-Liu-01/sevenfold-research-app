import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type ModalSize = "sm" | "md" | "lg";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
};

const sizeToWidth: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div
        className={cn(
          "w-full rounded-2xl border border-border-soft bg-surface-base shadow-2xl",
          sizeToWidth[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border-soft px-6 py-4">
          <div className="space-y-1">
            {title ? (
              <p className="text-base font-semibold text-text-primary">{title}</p>
            ) : null}
            {description ? (
              <p className="text-sm text-text-secondary">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="px-6 py-4 text-sm text-text-primary">{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-3 border-t border-border-soft px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
};
