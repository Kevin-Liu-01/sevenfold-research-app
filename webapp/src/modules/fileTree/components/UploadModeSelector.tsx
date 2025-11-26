type UploadMode = "single" | "zip" | "dir"

type UploadModeSelectorProps = {
  value: UploadMode
  onChange: (mode: UploadMode) => void
  disabled?: boolean
}

const options: { value: UploadMode; label: string; hint: string }[] = [
  { value: "single", label: "Single file", hint: "" },
  { value: "zip", label: "Overleaf .zip", hint: "" },
  { value: "dir", label: "Directory (coming soon)", hint: "" },
]

export const UploadModeSelector = ({ value, onChange, disabled }: UploadModeSelectorProps) => (
  <div className="flex w-40 flex-col gap-2 border-r border-border-soft pr-3">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        className={`rounded-md px-3 py-2 text-left transition-colors ${
          value === opt.value
            ? "bg-surface-contrast text-text-primary"
            : "hover:bg-surface-contrast text-text-secondary"
        }`}
        onClick={() => onChange(opt.value)}
        disabled={disabled}
      >
        {opt.label}
      </button>
    ))}
  </div>
)
