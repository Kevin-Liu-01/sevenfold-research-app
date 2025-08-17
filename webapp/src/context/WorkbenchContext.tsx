import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import supabase from "../auth/supabaseClient";

import type { Paper, ChatConvo } from "../../../schema/db-types";

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

    // Chat
    convos: ChatConvo[];
    selectedConvo: ChatConvo | null;
    refreshConvos: () => Promise<void>;
    setSelectedConvo: (convo: ChatConvo | null) => void;

    // Sources
    papers: Paper[];
    selectedPaper: Paper | null;
    refreshPapers: () => Promise<void>;
    setSelectedPaper: (paper: Paper | null) => void;

    // Compose
    createNewDocument: () => Promise<void>;
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

    useEffect(() => {
        refreshPapers();
    }, [refreshPapers]);

    // Chat Conversations
    const [convos, setConvos] = useState<ChatConvo[]>([]);
    const [selectedConvo, setSelectedConvo] = useState<ChatConvo | null>(null);

    const refreshConvos = useCallback(async () => {
        if (!projectId) return;

        const { data, error } = await supabase
            .from("chat_convos")
            .select("*")
            .eq("project_id", projectId)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("Error fetching chat conversations:", error.message);
            return;
        }

        const convos = (data ?? []).filter((c): c is ChatConvo => !!c);
        setConvos(convos);
    }, [projectId]);

    useEffect(() => {
        refreshConvos();
    }, [refreshConvos]);

    // const createNewDocument = useCallback(async () => {
    //     if (!projectId) return;
    //     const { data, error } = await supabase
    //         .from('documents'
    //         .insert({ project_id: projectId, title: 'Untitled Document', content: '' })
    //         .select('*')
    //         .single();
    //     if (error) {
    //         console.error('Error creating document:', error.message);
    //         return;
    //     }
    //     setActiveViewer('compose');
    // }, [projectId]);

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
                convos,
                selectedConvo,
                setSelectedConvo,
                refreshConvos,
                // createNewDocument,
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
