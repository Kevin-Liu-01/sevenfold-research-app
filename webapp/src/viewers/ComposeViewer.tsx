import React, { useState, useCallback } from "react";
import type { Composition } from "../../../schema/db-types";
import { useWorkbench } from "../context/WorkbenchContext";
import type { EditProposal } from "../types/compose";
import ComposeSidebar from "../components/compose/ComposeSidebar";
import ComposeEditor from "../components/compose/ComposeEditor";
import { createComposition, updateComposition } from "../api/compose";
import { DEFAULT_LATEX_TEMPLATE } from "../constants/compose";

const ComposeViewer: React.FC = () => {
    const { projectId, compositions, selectedComposition, setSelectedComposition, refreshCompositions } = useWorkbench();
    const [isCreating, setIsCreating] = useState(false);
    const [editProposals, setEditProposals] = useState<EditProposal[]>([]);

    const handleSelectComposition = (composition: Composition) => {
        setSelectedComposition(composition);
        setEditProposals([]); // Clear proposals when switching compositions
    };

    const handleEditProposalsChange = useCallback((newProposals: EditProposal[]) => {
        // Merge new proposals with existing ones (avoid duplicates by id)
        setEditProposals(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewProposals = newProposals.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewProposals];
        });
    }, []);

    const handleAcceptProposal = useCallback(async (proposalId: string, newContent: string) => {
        const proposal = editProposals.find((p) => p.id === proposalId);

        if (!proposal || !selectedComposition?.id) return;

        try {
            await updateComposition(selectedComposition.id, { contents: newContent });
            if (selectedComposition) {
                selectedComposition.contents = newContent;
            }
            setEditProposals((prev) => prev.filter((p) => p.id !== proposalId));
            refreshCompositions();
        } catch (error) {
            console.error("Failed to apply edit:", error);
            alert("Failed to apply edit");
        }
    }, [editProposals, selectedComposition, refreshCompositions]);

    const handleRejectProposal = useCallback((proposalId: string) => {
        // Simply remove the rejected proposal without changing content
        setEditProposals(prev => prev.filter(p => p.id !== proposalId));
    }, []);

    const pendingProposals = editProposals.filter(p => p.status === 'pending');

    const createNewComposition = async () => {
        setIsCreating(true);
        try {
            const newComposition = await createComposition({
                project_id: projectId,
                type: "latex",
                title: "",
                contents: DEFAULT_LATEX_TEMPLATE,
            });
            setSelectedComposition(newComposition);
            await refreshCompositions();
        } catch (error: unknown) {
            console.error("Error creating composition:", error);
            alert(error instanceof Error ? error.message : "Failed to create composition");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex h-full bg-app-inner">
            <ComposeSidebar
                compositions={compositions}
                selectedComposition={selectedComposition}
                onSelectComposition={handleSelectComposition}
                onNewComposition={createNewComposition}
                isCreating={isCreating}
                onEditProposalsChange={handleEditProposalsChange}
            />
            <div className="flex-1">
                <ComposeEditor
                    pendingProposals={pendingProposals}
                    onAcceptProposal={handleAcceptProposal}
                    onRejectProposal={handleRejectProposal}
                />
            </div>
        </div>
    );
};

export default ComposeViewer;
