import { useState, useMemo } from "react";
import { useWorkbench, ViewType } from "../context/WorkbenchContext";
import type { Paper, UploadedPaperPayload } from "../../../schema/db-types";
import supabase from "../auth/supabaseClient";
import UploadPaperModal from "./UploadPaperModal";
import Modal from "../components/ui/Modal";

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
            className="group flex w-full items-center justify-start space-x-2 bg-[var(--color-off-black)] hover:opacity-90 hover:cursor-pointer text-[var(--color-app-inner)] text-sm font-medium px-2 py-1 rounded-md transition"
        >
            <span className="material-icons text-base text-[var(--color-app-inner)] transition-transform duration-200 group-hover:scale-[1.15]">
                upload_file
            </span>
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
    onSelectPaper: (paper: Paper) => void;
}> = ({ papers, selectedPaper, onSelectPaper }) => {
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
                        onClick={() => onSelectPaper(paper)}
                    />
                ))}
            </div>
        );
    }
};
const SourcesPanel: React.FC = () => {
    const {
        projectId,
        papers,
        selectedPaper,
        setSelectedPaper,
        refreshPapers,
        openModal,
        closeModal,
        setCurrentView,
    } = useWorkbench();
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle paper selection
    const handleSelectPaper = (paper: Paper) => {
        // Track last access time in localStorage
        const accessKey = `paper_access_${projectId}_${paper.id}`;
        localStorage.setItem(accessKey, Date.now().toString());

        setSelectedPaper(paper);
        setCurrentView(ViewType.Library);
    };

    const filtered = useMemo(() => {
        // Get papers (filtered by search if applicable)
        let result = papers;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = papers.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.authors?.some((a) => a.toLowerCase().includes(q))
            );
        }

        // Sort by most recently accessed
        return result.sort((a, b) => {
            const accessKeyA = `paper_access_${projectId}_${a.id}`;
            const accessKeyB = `paper_access_${projectId}_${b.id}`;
            const timeA = parseInt(localStorage.getItem(accessKeyA) || "0");
            const timeB = parseInt(localStorage.getItem(accessKeyB) || "0");
            return timeB - timeA; // Most recent first
        });
    }, [papers, searchQuery, projectId]);

    const processPdf = async (payload: {
        file: File;
        titlePage: number | null;
        abstractPages: number[];
    }) => {
        const {
            data: { session },
            error: authErr,
        } = await supabase.auth.getSession();
        if (authErr || !session?.access_token) throw new Error("Not authenticated");

        const processFormData = new FormData();
        processFormData.append("file", payload.file);
        processFormData.append("project_id", projectId);

        const pagesToProcess = [
            ...(payload.titlePage ? [payload.titlePage] : []),
            ...(payload.abstractPages || []),
        ];
        const pages_spec =
            pagesToProcess.length > 0
                ? [...new Set(pagesToProcess)].sort((a, b) => a - b).join(",")
                : "1,2";
        processFormData.append("pages_spec", pages_spec);

        const processResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/papers/process-pdf`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}` },
                body: processFormData,
            }
        );

        if (processResponse.ok) {
            return await processResponse.json();
        } else {
            const errData = await processResponse
                .json()
                .catch(() => ({ detail: "Failed to process PDF" }));
            throw new Error(errData.detail);
        }
    };

    const linkPaper = async ({ paperId, file }: { paperId: string; file: File }) => {
        setIsUploading(true);
        setError(null);
        try {
            const {
                data: { session },
                error: authErr,
            } = await supabase.auth.getSession();
            if (authErr || !session?.access_token) throw new Error("Not authenticated");

            const formData = new FormData();
            formData.append("paper_id", paperId);
            formData.append("project_id", projectId);
            formData.append("file", file);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/papers/link-paper`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}` },
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to link paper.");
            }

            await refreshPapers();
            closeModal();
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An unknown error occurred");
        } finally {
            setIsUploading(false);
        }
    };

    const uploadPaper = async (payload: UploadedPaperPayload): Promise<boolean> => {
        setIsUploading(true);
        setError(null);
        try {
            const {
                data: { session },
                error: authErr,
            } = await supabase.auth.getSession();
            if (authErr || !session?.access_token) throw new Error("Not authenticated");

            const finalMetadata = {
                title: payload.title?.trim() || payload.file.name.replace(".pdf", ""),
                authors: payload.authors || [],
                doi: payload.doi?.trim() || null,
                year: null as number | null,
                month: null as number | null,
                day: null as number | null,
            };

            if (payload.publicationDate) {
                const date = new Date(payload.publicationDate);
                finalMetadata.year = date.getUTCFullYear();
                finalMetadata.month = date.getUTCMonth() + 1;
                finalMetadata.day = date.getUTCDate();
            }

            const uploadFormData = new FormData();
            uploadFormData.append("file", payload.file);
            uploadFormData.append("project_id", projectId);
            uploadFormData.append("paper_type", "source");
            uploadFormData.append("metadata_json", JSON.stringify(finalMetadata));

            const uploadResponse = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/papers/upload-pdf`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    body: uploadFormData,
                }
            );

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(JSON.parse(errorText).detail || "Upload failed");
            }

            await refreshPapers();
            return true;
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Failed to upload paper");
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenUploadModal = () => {
        setError(null);
        openModal(
            <Modal onClose={closeModal}>
                <UploadPaperModal
                    onClose={closeModal}
                    onProcessPdf={processPdf}
                    onLinkPaper={linkPaper}
                    onSubmit={async (data) => {
                        const success = await uploadPaper(data);
                        if (success) closeModal();
                    }}
                    isUploading={isUploading}
                />
            </Modal>
        );
    };

    const handleMySourcesClick = () => {
        setSelectedPaper(null);
        setCurrentView(ViewType.Library);
    };

    return (
        <div className="flex flex-col h-full space-y-3">
            <h1 className="text-lg font-semibold">Library</h1>
            <div className="flex flex-col space-y-1">
                <button
                    onClick={handleMySourcesClick}
                    className="group flex w-full items-center justify-start space-x-2 bg-[var(--color-off-black)] hover:opacity-90 hover:cursor-pointer text-[var(--color-app-inner)] text-sm font-medium px-2 py-1 rounded-md transition"
                >
                    <span className="material-icons text-base text-[var(--color-app-inner)] transition-transform duration-200 group-hover:scale-[1.15]">
                        local_library
                    </span>
                    <span>My Sources</span>
                </button>
                <UploadPaperButton onClick={handleOpenUploadModal} />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="material-icons text-red-400 text-sm">error</span>
                        </div>
                        <div className="ml-2">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setError(null)}
                                className="text-red-400 hover:text-red-600"
                            >
                                <span className="material-icons text-sm">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <div className="flex-1 min-h-0">
                <PapersList
                papers={filtered}
                selectedPaper={selectedPaper}
                onSelectPaper={handleSelectPaper}
            />
            </div>
        </div>
    );
};

export default SourcesPanel;
