import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import supabase from "../auth/supabaseClient";

import type { Paper, Composition } from "../../../schema/db-types";

export enum ViewType {
    Search = "search",
    Chat = "chat",
    Sources = "sources",
    Compose = "compose",
    Settings = "settings",
}

interface WorkbenchContextType {
    projectId: string;

    // View management
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
    hoveredView: ViewType | null;
    setHoveredView: (view: ViewType | null) => void;

    // TODO: Chat

    // Sources
    papers: Paper[];
    refreshPapers: () => Promise<void>;
    selectedPaper: Paper | null;
    setSelectedPaper: (paper: Paper | null) => void;

    // Compositions
    compositions: Composition[];
    refreshCompositions: () => Promise<void>;
    selectedComposition: Composition | null;
    setSelectedComposition: (composition: Composition | null) => void;
}

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export const WorkbenchProvider: React.FC<{ projectId: string; children: React.ReactNode }> = ({
    projectId,
    children,
}) => {
    const [currentView, setCurrentView] = useState<ViewType>(ViewType.Search);
    const [hoveredView, setHoveredView] = useState<ViewType | null>(null);

    // Sources
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

    // Compositions
    const [compositions, setCompositions] = useState<Composition[]>([]);
    const [selectedComposition, setSelectedComposition] = useState<Composition | null>(null);

    const refreshPapers = useCallback(async () => {
        if (!projectId) return;

        const { data, error } = await supabase
            .from("project_paper_links")
            .select("paper:paper_attrs(*)")
            .eq("project_id", projectId)
            .eq("has_paper", true);

        if (error) {
            console.error("Error fetching project papers:", error.message);
            return;
        }

        const papers = (data ?? []).map((p: any) => p.paper).filter((p): p is Paper => !!p);
        setPapers(papers);
    }, [projectId]);

    const refreshCompositions = useCallback(async () => {
        if (!projectId) return;

        const { data: { session }, error: authErr } = await supabase.auth.getSession();
        if (authErr || !session?.access_token) {
            console.error("Authentication error:", authErr);
            return;
        }

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/compose/project/${projectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            if (!res.ok) {
                console.error("Error fetching compositions:", res.status);
                return;
            }

            const compositions = await res.json();
            setCompositions(compositions);
        } catch (error) {
            console.error("Error fetching compositions:", error);
        }
    }, [projectId]);

    useEffect(() => {
        refreshPapers();
        refreshCompositions();
    }, [refreshPapers, refreshCompositions]);

    return (
        <WorkbenchContext.Provider
            value={{
                projectId,
                currentView,
                setCurrentView,
                hoveredView,
                setHoveredView,
                papers,
                refreshPapers,
                selectedPaper,
                setSelectedPaper,
                compositions,
                refreshCompositions,
                selectedComposition,
                setSelectedComposition,
            }}
        >
            {children}
        </WorkbenchContext.Provider>
    );
};

export const useWorkbench = () => {
    const ctx = useContext(WorkbenchContext);
    if (!ctx) throw new Error("useWorkbench must be used within WorkbenchProvider");
    return ctx;
};
