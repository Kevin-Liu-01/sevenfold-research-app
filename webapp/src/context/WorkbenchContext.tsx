// src/components/context/WorkbenchContext.tsx

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import supabase from "../auth/supabaseClient";
import type { Paper, ChatConvo, Composition } from "../../../schema/db-types";
import { usePersistentState } from "../hooks/usePersistentState";

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

    // Compositions
    compositions: Composition[];
    refreshCompositions: () => Promise<void>;
    selectedComposition: Composition | null;
    setSelectedComposition: (composition: Composition | null) => void;

    // Modals
    modal: React.ReactNode | null;
    openModal: (content: React.ReactNode) => void;
    closeModal: () => void;
}

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export const WorkbenchProvider: React.FC<{
    projectId: string;
    children: React.ReactNode;
}> = ({ projectId, children }) => {
    const [currentView, setCurrentView] = usePersistentState<ViewType>(
        `workbench:${projectId}:view`,
        ViewType.Search
    );

    const [hoveredView, _setHoveredView] = useState<ViewType | null>(null);
    const hoverTimeoutRef = useRef<number | null>(null);

    // We lock the hovered view if modal is open
    const [lockedView, setLockedView] = useState<ViewType | null>(null);
    // Sources
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedPaper, setSelectedPaper] = usePersistentState<Paper | null>(
        `workbench:${projectId}:selectedPaper`,
        null
    );

    // Compositions
    const [compositions, setCompositions] = useState<Composition[]>([]);
    const [selectedComposition, setSelectedComposition] = useState<Composition | null>(null);

    // Modals
    const [modal, setModal] = useState<React.ReactNode | null>(null);

    const setHoveredView = useCallback(
        (view: ViewType | null) => {
            if (modal) {
                // lock current engagement until modal closes
                if (view) setLockedView(view);
                return;
            }

            // Always clear any pending timeout when the hover state changes.
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }

            if (view === null) {
                // If we're clearing the hover, delay it to allow moving to the panel.
                hoverTimeoutRef.current = window.setTimeout(() => {
                    _setHoveredView(null);
                }, 150); // 150ms delay
            } else {
                // If we're setting a new hover view, do it immediately.
                _setHoveredView(view);
            }
        },
        [modal]
    );

    const openModal = useCallback(
        (content: React.ReactNode) => {
            setLockedView(currentView); // persist sidebar engagement
            setModal(content);
        },
        [currentView]
    );

    const closeModal = useCallback(() => {
        setModal(null);
        setLockedView(null); // release lock
    }, []);

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

    const refreshCompositions = useCallback(async () => {
        if (!projectId) return;

        const {
            data: { session },
            error: authErr,
        } = await supabase.auth.getSession();
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
        refreshConvos();
        refreshCompositions();
    }, [refreshPapers, refreshCompositions]);

    return (
        <WorkbenchContext.Provider
            value={{
                projectId,
                currentView,
                setCurrentView,
                hoveredView: lockedView ?? hoveredView,
                setHoveredView,
                papers,
                refreshPapers,
                selectedPaper,
                setSelectedPaper,
                convos,
                selectedConvo,
                setSelectedConvo,
                refreshConvos,
                compositions,
                refreshCompositions,
                selectedComposition,
                setSelectedComposition,
                modal,
                openModal,
                closeModal,
            }}
        >
            {children}

            {/* Modals are rendered here to overlay entire workbench*/}
            {modal}
        </WorkbenchContext.Provider>
    );
};

export const useWorkbench = () => {
    const ctx = useContext(WorkbenchContext);
    if (!ctx) throw new Error("useWorkbench must be used within WorkbenchProvider");
    return ctx;
};
