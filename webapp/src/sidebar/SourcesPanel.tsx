import React, { useState, useMemo } from "react";

import { useWorkbench } from "../context/WorkbenchContext";
import type { Paper, UploadedPaperPayload } from "../../../schema/db-types";
import supabase from "../auth/supabaseClient";

import UploadPaperModal from "./UploadPaperModal";
import Modal from "../components/ui/Modal"; // wrap all modals with this

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
                    placeholder="Search by title or author…"
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

const UploadPaperButton: React.FC<{
    onClick: () => void;
}> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center space-x-1 bg-kets-orange hover:bg-kets-orange-500 hover:cursor-pointer text-white text-sm font-medium px-2 py-1 rounded-md transition"
        >
            <span className="material-icons text-base">upload_file</span>
            <span>Upload Paper</span>
        </button>
    );
};

const PaperBox: React.FC<{
    paper: Paper;
    isSelected: boolean;
    onClick: () => void;
}> = ({ paper, isSelected, onClick }) => {
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
                        {paper.title || "Untitled Paper"}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {paper.authors?.join(", ") || "Unknown author"}
                    </span>
                </div>
            </div>
        </div>
    );
};

const PapersList: React.FC<{
    papers: Paper[];
    selectedPaper: Paper | null;
    setSelectedPaper: (paper: Paper | null) => void;
}> = ({ papers, selectedPaper, setSelectedPaper }) => {
    if (!papers || papers.length === 0) {
        return <div className="text-gray-500 text-sm text-center py-4">No papers found</div>;
    } else {
        return (
            <div className="flex flex-col space-y-2 h-full overflow-y-auto">
                {papers.map((paper) => (
                    <PaperBox
                        key={paper.id}
                        paper={paper}
                        isSelected={selectedPaper?.id === paper.id}
                        onClick={() => setSelectedPaper(paper)}
                    />
                ))}
            </div>
        );
    }
};

const SourcesPanel: React.FC = () => {
    const { projectId, papers, selectedPaper, setSelectedPaper, refreshPapers, openModal, closeModal } =
        useWorkbench();

    const [searchQuery, setSearchQuery] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [duplicateError, setDuplicateError] = useState<any>(null);
    const [currentUploadFile, setCurrentUploadFile] = useState<File | null>(null);

    // Search for papers
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return papers;
        const q = searchQuery.toLowerCase();
        return papers.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.authors?.some((a) => a.toLowerCase().includes(q))
        );
    }, [papers, searchQuery]);

    // Upload function that calls the API endpoints
    const uploadPaper = async (payload: UploadedPaperPayload) => {
        setIsUploading(true);
        setCurrentUploadFile(payload.file); // Store the file being uploaded
        setError(null); // Clear any previous errors
        try {
            // Step 1: Get authentication token
            const { data: { session }, error: authErr } = await supabase.auth.getSession();
            if (authErr || !session?.access_token) {
                throw new Error("Not authenticated");
            }

            // Step 2: Process PDF to extract metadata (optional)
            let extractedMetadata: any = {};
            try {
                const processFormData = new FormData();
                processFormData.append("file", payload.file);
                processFormData.append("project_id", projectId);
                
                // Build pages_spec from user input (titlePage and abstractPages)
                const pagesToProcess: number[] = [];
                if (payload.titlePage) {
                    pagesToProcess.push(payload.titlePage);
                }
                if (payload.abstractPages && payload.abstractPages.length > 0) {
                    pagesToProcess.push(...payload.abstractPages);
                }
                
                // If no specific pages provided, default to first two pages
                const pages_spec = pagesToProcess.length > 0 
                    ? [...new Set(pagesToProcess)].sort((a, b) => a - b).join(",")
                    : "1,2";
                
                processFormData.append("pages_spec", pages_spec);

                const processResponse = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/papers/process-pdf`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: processFormData,
                    }
                );

                if (processResponse.ok) {
                    const processResult = await processResponse.json();
                    extractedMetadata = processResult.metadata || {};
                }
            } catch (error) {
                console.warn("Failed to extract metadata, proceeding with manual data:", error);
            }

            // Step 3: Prepare final metadata (prefer user input over extracted data)
            const finalMetadata = {
                title: extractedMetadata.title || payload.title?.trim() || payload.file.name.replace('.pdf', ''),
                authors: payload.authors?.length ? payload.authors : (extractedMetadata.authors || []),
                abstract: extractedMetadata.abstract || null,
                year: null as number | null,
                month: null as number | null,
                day: null as number | null,
                doi: payload.doi?.trim() || extractedMetadata.doi || null,
                category: extractedMetadata.category || null,
            };

            // Handle publication date
            if (payload.publicationDate) {
                const dateParts = payload.publicationDate.split('-');
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);
                finalMetadata.year = !isNaN(year) ? year : null;
                finalMetadata.month = !isNaN(month) ? month : null;
                finalMetadata.day = !isNaN(day) ? day : null;
            } else if (extractedMetadata.year) {
                finalMetadata.year = extractedMetadata.year;
                finalMetadata.month = extractedMetadata.month || null;
                finalMetadata.day = extractedMetadata.day || null;
            }

            // Step 4: Upload the PDF with metadata
            const uploadFormData = new FormData();
            uploadFormData.append("file", payload.file);
            uploadFormData.append("project_id", projectId);
            uploadFormData.append("paper_type", "source"); // Default to source type
            uploadFormData.append("metadata_json", JSON.stringify(finalMetadata));

            const uploadResponse = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/papers/upload-pdf`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: uploadFormData,
                }
            );

            if (!uploadResponse.ok) {
                // Parse API error response for user-friendly messages
                const errorText = await uploadResponse.text();
                let errorMessage = "Upload failed";
                
                try {
                    const errorData = JSON.parse(errorText);
                    
                    // Check if this is a duplicate error
                    if (uploadResponse.status === 409 && errorData.detail?.error === 'duplicate_detected') {
                        setDuplicateError(errorData.detail);
                        return; // Don't throw error, let the modal handle it
                    }
                    
                    errorMessage = errorData.detail?.message || errorData.detail || errorData.message || errorMessage;
                } catch {
                    // API didn't return JSON, use status-based message
                    if (uploadResponse.status === 401) errorMessage = "Authentication failed. Please log in again.";
                    else if (uploadResponse.status === 403) errorMessage = "Permission denied for this project.";
                    else if (uploadResponse.status === 409) errorMessage = "Duplicate paper detected.";
                    else if (uploadResponse.status === 413) errorMessage = "File too large. Please use a smaller PDF.";
                    else if (uploadResponse.status === 415) errorMessage = "Invalid file type. Please upload a PDF.";
                    else if (uploadResponse.status >= 500) errorMessage = "Server error. Please try again.";
                }
                
                throw new Error(errorMessage);
            }

            // Step 5: Refresh the papers list
            await refreshPapers();
        } catch (error: any) {
            console.error("Error uploading paper:", error);
            // TODO: Replace this alert with proper error UI later
            alert(error instanceof Error ? error.message : 'Failed to upload paper');
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenUploadModal = () => {
        setError(null); // Clear any previous errors when opening modal
        setDuplicateError(null); // Clear any previous duplicate errors
        openModal(
            <Modal onClose={closeModal}>
                <UploadPaperModal
                    onClose={closeModal}
                    onSubmit={async (data) => {
                        await uploadPaper(data);
                        if (!error && !duplicateError) { // Only close modal if upload was successful
                            closeModal();
                        }
                    }}
                    isUploading={isUploading}
                    duplicateError={duplicateError}
                    onForceUpload={async (data: UploadedPaperPayload) => {
                        // Re-upload with force=true
                        const formData = new FormData();
                        formData.append("file", data.file);
                        formData.append("project_id", projectId);
                        formData.append("paper_type", "source");
                        formData.append("force", "true");
                        
                        const finalMetadata = {
                            title: data.title?.trim() || data.file.name.replace('.pdf', ''),
                            authors: data.authors || [],
                            abstract: null,
                            year: null,
                            month: null,
                            day: null,
                            doi: data.doi?.trim() || null,
                            category: null,
                        };
                        
                        formData.append("metadata_json", JSON.stringify(finalMetadata));
                        
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) {
                            throw new Error("Not authenticated");
                        }
                        
                        const response = await fetch(
                            `${import.meta.env.VITE_API_BASE_URL}/papers/upload-pdf`,
                            {
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${session.access_token}`,
                                },
                                body: formData,
                            }
                        );
                        
                        if (response.ok) {
                            await refreshPapers();
                            setDuplicateError(null);
                            closeModal();
                        } else {
                            throw new Error("Force upload failed");
                        }
                    }}
                />
            </Modal>
        );
    };

    // Update modal when upload state changes to show loading state or duplicate error
    React.useEffect(() => {
        // Only update if we have an active modal and are currently uploading or have duplicate error
        if (isUploading || duplicateError) {
            // For duplicate error, allow closing. For uploading, prevent closing.
            const handleClose = duplicateError && !isUploading ? () => {
                setDuplicateError(null);
                setCurrentUploadFile(null);
                closeModal();
            } : () => {};
            const handleNoOpSubmit = async (_data: UploadedPaperPayload) => {};
            
            openModal(
                <Modal onClose={handleClose}>
                    <UploadPaperModal
                        onClose={handleClose}
                        onSubmit={handleNoOpSubmit}
                        isUploading={isUploading}
                        duplicateError={duplicateError}
                        initialFile={currentUploadFile}
                        onForceUpload={async (data: UploadedPaperPayload) => {
                            // Force upload functionality here
                            const formData = new FormData();
                            formData.append("file", data.file);
                            formData.append("project_id", projectId);
                            formData.append("paper_type", "source");
                            formData.append("force", "true");
                            
                            const finalMetadata = {
                                title: duplicateError?.new_paper?.title || data.title?.trim() || data.file.name.replace('.pdf', ''),
                                authors: duplicateError?.new_paper?.authors || data.authors || [],
                                abstract: duplicateError?.new_paper?.abstract || null,
                                year: null,
                                month: null,
                                day: null,
                                doi: data.doi?.trim() || null,
                                category: null,
                            };
                            
                            formData.append("metadata_json", JSON.stringify(finalMetadata));
                            
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session?.access_token) {
                                throw new Error("Not authenticated");
                            }
                            
                            const response = await fetch(
                                `${import.meta.env.VITE_API_BASE_URL}/papers/upload-pdf`,
                                {
                                    method: "POST",
                                    headers: {
                                        Authorization: `Bearer ${session.access_token}`,
                                    },
                                    body: formData,
                                }
                            );
                            
                            if (response.ok) {
                                await refreshPapers();
                                setDuplicateError(null);
                                closeModal();
                            } else {
                                const errorText = await response.text();
                                try {
                                    const errorData = JSON.parse(errorText);
                                    throw new Error(errorData.detail?.message || errorData.detail || "Force upload failed");
                                } catch {
                                    throw new Error("Force upload failed");
                                }
                            }
                        }}
                    />
                </Modal>
            );
        }
    }, [isUploading, duplicateError, openModal, projectId, refreshPapers, closeModal]);

    return (
        <div className="flex flex-col h-full space-y-3">
            <h1 className="text-lg font-semibold">Sources</h1>

            <UploadPaperButton onClick={handleOpenUploadModal} />

            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            <div className="flex-1 min-h-0">
                <PapersList
                    papers={filtered}
                    selectedPaper={selectedPaper}
                    setSelectedPaper={setSelectedPaper}
                />
            </div>
        </div>
    );
};

export default SourcesPanel;
