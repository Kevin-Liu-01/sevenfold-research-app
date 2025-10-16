import { useWorkbench, ViewType } from "../context/WorkbenchContext";

export type SidebarButtonProps = {
    targetView: ViewType;
    icon: string;
    label: string;
};

export default function SidebarButton({ targetView, icon, label }: SidebarButtonProps) {
    const wrapper = "group flex flex-col items-center justify-center focus:outline-none";
    const boxBase =
        "flex items-center justify-center p-2 rounded-xl transition-all duration-200 text-[var(--color-off-black)]";
    const iconBase = "material-icons-outlined transition-transform duration-200";
    const labelBase = "text-xs mt-0.5 transition-all duration-200 text-[var(--color-off-black)]";

    const { currentView, setCurrentView } = useWorkbench();

    const active = currentView === targetView;

    // conditional classes
    const boxState = active
        ? "bg-[var(--color-off-black)] text-[var(--color-app-inner)] shadow-sm"
        : "group-hover:bg-gray-100";
    const iconState = active
        ? "text-lg scale-[1.18] text-[var(--color-app-inner)]"
        : "text-base group-hover:scale-[1.15] text-[var(--color-off-black)]";
    const labelState = active
        ? "font-medium text-[var(--color-off-black)]"
        : "font-normal group-hover:font-medium";

    return (
        <button
            type="button"
            className={wrapper}
            onClick={() => setCurrentView(targetView)}
        >
            <div className={`${boxBase} ${boxState}`}>
                <span className={`${iconBase} ${iconState}`}>{icon}</span>
            </div>
            <span className={`${labelBase} ${labelState}`}>{label}</span>
        </button>
    );
}
