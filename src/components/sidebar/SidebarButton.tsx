
export type SidebarButtonProps = {
  icon: string
  label: string
  active: boolean
  onClick: () => void
  onHover: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function SidebarButton({
  icon,
  label,
  active,
  onClick,
  onHover,
  onMouseEnter,
  onMouseLeave,
}: SidebarButtonProps) {
  const wrapper = 'group flex flex-col items-center justify-center focus:outline-none'
  const boxBase = 'flex items-center justify-center p-2 rounded-xl transition-all duration-200'
  const iconBase = 'material-icons-outlined transition-all duration-200'
  const labelBase = 'text-xs mt-0.5 transition-all duration-200'

  // conditional classes
  const boxState = active
    ? 'bg-blue-50 text-blue-600 shadow-sm'
    : 'text-gray-500 group-hover:bg-gray-100 group-hover:shadow-sm'
  const iconState = active
    ? 'text-lg scale-110'
    : 'text-base group-hover:scale-110'
  const labelState = active
    ? 'font-medium'
    : 'font-normal group-hover:font-medium'

  return (
    <button
      type="button"
      className={wrapper}
      onClick={onClick}
      onMouseEnter={() => {
        onHover();
        onMouseEnter?.();
      }}
      onMouseLeave={onMouseLeave}
    >
      <div className={`${boxBase} ${boxState}`}>
        <span className={`${iconBase} ${iconState}`}>
          {icon}
        </span>
      </div>
      <span className={`${labelBase} ${labelState}`}>
        {label}
      </span>
    </button>
  )
}

export default SidebarButton
