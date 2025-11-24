import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/shared/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md"
  shape?: "default" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", shape = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const sizeClasses =
      shape === "icon"
        ? size === "sm"
          ? "h-9 w-9 p-2"
          : "h-10 w-10 p-2.5"
        : size === "sm"
          ? "px-3 py-1.5 text-sm"
          : "px-4 py-2 text-sm"

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-accent text-white hover:bg-accent/90": variant === "default",
            "border border-border-medium bg-transparent hover:bg-surface-contrast": variant === "outline",
            "hover:bg-surface-contrast": variant === "ghost",
          },
          sizeClasses,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
