import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import supabase from '../auth/supabaseClient';

import type { Paper } from '../../database.types';

export enum ViewType {
    Search = 'search',
    Chat    = 'chat',
    Sources = 'sources',
    Compose = 'compose',
    Settings= 'settings',
}

interface WorkbenchContextType {

    // View management
    currentView         : ViewType;
    setCurrentView      : (view: ViewType) => void;
    hoveredView         : ViewType | null;
    setHoveredView      : (view: ViewType | null) => void;

    // TODO: Chat

    // Sources
    papers              : Paper[];  
    refreshPapers      : () => Promise<void>;
    selectedPaper       : Paper | null;
    setSelectedPaper    : (paper: Paper | null) => void;

    // Compose
    createNewDocument   : () => Promise<void>;
}

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export const WorkbenchProvider: React.FC<{ projectId: string; children: React.ReactNode }> = ({ projectId, children }) => {
    const [currentView, setCurrentView] = useState<ViewType>(ViewType.Search);
    const [hoveredView, setHoveredView] = useState<ViewType | null>(null)

    // Sources
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

    const refreshPapers = useCallback(async () => {
        if (!projectId) return;
        const { data: papers, error } = await supabase
            .from('papers')
            .select('*')
            .eq('project_id', projectId);
        if (error) {
            console.error('Error fetching papers:', error.message);
            return;
        }
        setPapers(papers || []);
    }, [projectId]);
    
    useEffect(() => { refreshPapers(); }, [refreshPapers]);

    // const createNewDocument = useCallback(async () => {
    //     if (!projectId) return;
    //     const { data, error } = await supabase
    //         .from('documents')
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
        <WorkbenchContext.Provider value={{
            currentView, setCurrentView,
            hoveredView, setHoveredView,
            papers,
            refreshPapers,
            selectedPaper, setSelectedPaper,
            // createNewDocument,
        }}>
            {children}
        </WorkbenchContext.Provider>
    );
};

export const useWorkbench = () => {
    const ctx = useContext(WorkbenchContext);
    if (!ctx) throw new Error('useWorkbench must be used within WorkbenchProvider');
    return ctx;
};