interface PaneToggleOption<T extends string> {
  label: string
  value: T
}

interface PaneToggleGroupProps<T extends string> {
  value: T
  options: PaneToggleOption<T>[]
  onChange: (value: T) => void
  density?: "regular" | "compact"
  fullWidth?: boolean
}

export const PaneToggleGroup = <T extends string>({
  value,
  options,
  onChange,
  density = "regular",
  fullWidth = false,
}: PaneToggleGroupProps<T>) => {
  return (
    <div
      className={[
        "bg-surface-contrast text-text-muted inline-flex rounded-full font-semibold uppercase tracking-wide",
        density === "compact" ? "p-0.5 text-[10px]" : "p-1 text-xs",
        "gap-1",
        fullWidth ? "w-full" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {options.map((option) => {
        const isActive = option.value === value
        const sizeClasses =
          density === "compact" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
        const widthClasses = fullWidth ? "flex-1 text-center" : ""
        const baseClasses = `rounded-full ${sizeClasses} ${widthClasses} transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`
        const activeClasses = isActive
          ? "bg-accent text-white shadow"
          : "text-text-muted hover:bg-surface-contrast/70"

        return (
          <button
            key={option.value}
            type="button"
            className={`${baseClasses} ${activeClasses}`}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

