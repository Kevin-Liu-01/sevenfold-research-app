import { useWorkbench, ViewType } from "../context/WorkbenchContext";

export type SidebarButtonProps = {
    targetView: ViewType;
    icon: string;
    label: string;
};

export default function SidebarButton({ targetView, icon, label }: SidebarButtonProps) {
    const wrapper = "group flex flex-col items-center justify-center focus:outline-none";
    const boxBase = "flex items-center justify-center p-2 rounded-xl transition-all duration-200";
    const iconBase = "material-icons-outlined transition-all duration-200";
    const labelBase = "text-xs mt-0.5 transition-all duration-200";

    const { currentView, setCurrentView, setHoveredView } = useWorkbench();

    const active = currentView === targetView;

    // conditional classes
    const boxState = active
        ? "bg-lime-500 text-black shadow-sm"
        : "text-gray-700 group-hover:text-lime-500";
    const iconState = active ? "text-lg scale-110 text-white" : "text-base group-hover:scale-110";
    const labelState = active ? "font-medium" : "font-normal group-hover:font-medium";

    return (
        <button
            type="button"
            className={wrapper}
            onClick={() => setCurrentView(targetView)}
            onMouseEnter={() => setHoveredView(targetView)}
            onMouseLeave={() => setHoveredView(currentView)}
        >
            <div className={`${boxBase} ${boxState}`}>
                <span className={`${iconBase} ${iconState}`}>{icon}</span>
            </div>
            <span className={`${labelBase} ${labelState}`}>{label}</span>
        </button>
    );
}
