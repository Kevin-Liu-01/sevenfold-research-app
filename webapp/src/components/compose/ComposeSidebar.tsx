import React, { useState } from "react";
import type { Composition } from "../../../schema/db-types";
import CompositionListPanel from "./CompositionListPanel";
import WritingAgentChat from "./WritingAgentChat";
import type { EditProposal } from "../../types/compose";

interface ComposeSidebarProps {
    compositions: Composition[];
    selectedComposition: Composition | null;
    onSelectComposition: (composition: Composition) => void;
    onNewComposition: () => void;
    isCreating: boolean;
    onEditProposalsChange: (proposals: EditProposal[]) => void;
}

// Sidebar hosting the composition list and agent tab.
const ComposeSidebar: React.FC<ComposeSidebarProps> = ({
    compositions,
    selectedComposition,
    onSelectComposition,
    onNewComposition,
    isCreating,
    onEditProposalsChange,
}) => {
    const [activeTab, setActiveTab] = useState<"compositions" | "chat">("compositions");

    return (
        <div className="w-64 bg-app-outer border-r border-gray-200 flex flex-col h-full">
            <div className="flex border-b border-gray-300">
                <button
                    onClick={() => setActiveTab("compositions")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "compositions"
                            ? "bg-app-inner text-gray-800 border-b-2 border-gray-800"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                >
                    Compositions
                </button>
                <button
                    onClick={() => setActiveTab("chat")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "chat"
                            ? "bg-app-inner text-gray-800 border-b-2 border-gray-800"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                >
                    Agent
                </button>
            </div>

            {activeTab === "compositions" ? (
                <CompositionListPanel
                    compositions={compositions}
                    selectedComposition={selectedComposition}
                    onSelectComposition={onSelectComposition}
                    onNewComposition={onNewComposition}
                    isCreating={isCreating}
                />
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    <WritingAgentChat onEditProposalsChange={onEditProposalsChange} />
                </div>
            )}
        </div>
    );
};

export default ComposeSidebar;
