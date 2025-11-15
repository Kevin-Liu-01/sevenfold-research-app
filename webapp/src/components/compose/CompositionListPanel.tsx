import React from "react";
import type { Composition } from "../../../../schema/db-types";

interface CompositionListPanelProps {
    compositions: Composition[];
    selectedComposition: Composition | null;
    onSelectComposition: (composition: Composition) => void;
    onNewComposition: () => void;
    isCreating: boolean;
}

const CompositionListPanel: React.FC<CompositionListPanelProps> = ({
    compositions,
    selectedComposition,
    onSelectComposition,
    onNewComposition,
    isCreating,
}) => (
    <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden min-h-0">
        <button
            onClick={onNewComposition}
            disabled={isCreating}
            className="group inline-flex items-center space-x-1 bg-[var(--color-off-black)] text-[var(--color-app-inner)] text-sm font-medium px-2 py-1 rounded-md transition hover:opacity-90 disabled:opacity-50"
        >
            {isCreating ? (
                <span className="material-icons text-base animate-spin text-[var(--color-app-inner)] transition-transform duration-200 group-hover:scale-[1.15]">
                    refresh
                </span>
            ) : (
                <span className="material-icons text-base text-[var(--color-app-inner)] transition-transform duration-200 group-hover:scale-[1.15]">
                    add
                </span>
            )}
            <span>{isCreating ? "Creating..." : "New Composition"}</span>
        </button>

        <div className="flex-1 overflow-y-auto min-h-0">
            {compositions.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-4">No compositions found</div>
            ) : (
                <div className="flex flex-col space-y-2">
                    {compositions.map((composition) => (
                        <div
                            key={composition.id}
                            onClick={() => onSelectComposition(composition)}
                            className={`flex items-center justify-between p-2 bg-app-inner rounded-md cursor-pointer transition
                                ${selectedComposition?.id === composition.id ? "bg-gray-150 shadow" : "hover:bg-gray-300"}
                            `}
                        >
                            <div className="flex items-center space-x-1">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                                        {composition.title || "Untitled"}
                                    </span>
                                    <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                        {composition.type?.toUpperCase() || "UNKNOWN"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

export default CompositionListPanel;
