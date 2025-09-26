import React, { useState, useMemo } from "react";

import { useWorkbench, ViewType } from "../context/WorkbenchContext";
import type { Composition } from "../../../schema/db-types";
import supabase from "../auth/supabaseClient";

const SearchBar: React.FC<{
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}> = ({ searchQuery, setSearchQuery }) => {
    return (
        <div className="bg-gray-50">
            <div className="flex h-full relative items-center justify-between gap-2">
                <span className="material-icons text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2">
                    search
                </span>
                <input
                    type="text"
                    placeholder="Search by title or type…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                    >
                        <span className="material-icons text-base">close</span>
                    </button>
                )}
            </div>
        </div>
    );
};

const NewCompositionButton: React.FC<{
    onClick: () => void;
    isCreating: boolean;
}> = ({ onClick, isCreating }) => {
    return (
        <button
            onClick={onClick}
            disabled={isCreating}
            className="inline-flex items-center space-x-1 bg-kets-orange text-white text-sm font-medium px-2 py-1 rounded-md transition disabled:opacity-50"
        >
            {isCreating ? (
                <span className="material-icons text-base animate-spin">refresh</span>
            ) : (
                <span className="material-icons text-base">add</span>
            )}
            <span>{isCreating ? "Creating..." : "New Composition"}</span>
        </button>
    );
};

const CompositionBox: React.FC<{
    composition: Composition;
    isSelected: boolean;
    onClick: () => void;
}> = ({ composition, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-2 bg-app-inner rounded-md cursor-pointer transition
                ${isSelected ? "bg-gray-150 shadow" : "hover:bg-gray-300"}
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
    );
};

const CompositionsList: React.FC<{
    compositions: Composition[];
    selectedComposition: Composition | null;
    setSelectedComposition: (composition: Composition | null) => void;
    onSelectComposition: (composition: Composition) => void;
}> = ({ compositions, selectedComposition, setSelectedComposition, onSelectComposition }) => {
    if (!compositions || compositions.length === 0) {
        return <div className="text-gray-500 text-sm text-center py-4">No compositions found</div>;
    } else {
        return (
            <div className="flex flex-col space-y-2">
                {compositions.map((composition) => (
                    <CompositionBox
                        key={composition.id}
                        composition={composition}
                        isSelected={selectedComposition?.id === composition.id}
                        onClick={() => onSelectComposition(composition)}
                    />
                ))}
            </div>
        );
    }
};

const ComposePanel: React.FC = () => {
    const { projectId, compositions, selectedComposition, setSelectedComposition, refreshCompositions, setCurrentView } = useWorkbench();

    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Search for compositions
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return compositions;
        const q = searchQuery.toLowerCase();
        return compositions.filter(
            (c) =>
                (c.title && c.title.toLowerCase().includes(q)) ||
                (c.type && c.type.toLowerCase().includes(q))
        );
    }, [compositions, searchQuery]);

    // Handle composition selection
    const handleSelectComposition = (composition: Composition) => {
        setSelectedComposition(composition);
        setCurrentView(ViewType.Compose);
    };

    // Create new untitled LaTeX composition
    const createNewComposition = async () => {
        setIsCreating(true);
        try {
            const { data: { session }, error: authErr } = await supabase.auth.getSession();
            if (authErr || !session?.access_token) {
                throw new Error("Not authenticated");
            }

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/compose/new_composition`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        type: "latex",
                        title: "",
                        contents: "",
                    }),
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to create composition: ${res.status} – ${text}`);
            }

            const newComposition = await res.json();
            setSelectedComposition(newComposition);
            setCurrentView(ViewType.Compose);
            await refreshCompositions();
        } catch (error: any) {
            console.error("Error creating composition:", error);
            alert(error.message || "Failed to create composition");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col space-y-3">
            <h1 className="text-lg font-semibold">Compositions</h1>

            <NewCompositionButton onClick={createNewComposition} isCreating={isCreating} />

            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            <CompositionsList
                compositions={filtered}
                selectedComposition={selectedComposition}
                setSelectedComposition={setSelectedComposition}
                onSelectComposition={handleSelectComposition}
            />
        </div>
    );
};

export default ComposePanel;
