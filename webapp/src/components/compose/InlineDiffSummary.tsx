import React from "react";
import type { EditProposal } from "../../types/compose";

interface InlineDiffSummaryProps {
    proposal: EditProposal;
    compositionName: string;
}

const InlineDiffSummary: React.FC<InlineDiffSummaryProps> = ({ proposal, compositionName }) => {
    const addedLines = proposal.operations.reduce((sum, op) => {
        if (op.type === "insert" || op.type === "replace") {
            return sum + (op.new_text?.split("\n").length || 0);
        }
        return sum;
    }, 0);

    const deletedLines = proposal.operations.reduce((sum, op) => {
        if (op.type === "delete" || op.type === "replace") {
            return sum + (op.old_text?.split("\n").length || 0);
        }
        return sum;
    }, 0);

    if (proposal.status === "accepted") {
        return (
            <div className="bg-green-50 border border-green-200 rounded px-2 py-1 mt-2 inline-flex items-center gap-1 text-xs">
                <span className="material-icons text-sm text-green-700">check_circle</span>
                <span className="text-green-700 font-medium">
                    {compositionName} +{addedLines} -{deletedLines}
                </span>
            </div>
        );
    }

    if (proposal.status === "rejected") {
        return (
            <div className="bg-red-50 border border-red-200 rounded px-2 py-1 mt-2 inline-flex items-center gap-1 text-xs">
                <span className="material-icons text-sm text-red-700">cancel</span>
                <span className="text-red-700 font-medium">
                    {compositionName} +{addedLines} -{deletedLines}
                </span>
            </div>
        );
    }

    return (
        <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1 mt-2 inline-flex items-center gap-1 text-xs cursor-default">
            <span className="material-icons text-sm text-purple-700">edit_note</span>
            <span className="text-purple-700 font-medium">{compositionName}</span>
            {addedLines > 0 && <span className="text-green-700 font-semibold">+{addedLines}</span>}
            {deletedLines > 0 && <span className="text-red-700 font-semibold">-{deletedLines}</span>}
        </div>
    );
};

export default InlineDiffSummary;
