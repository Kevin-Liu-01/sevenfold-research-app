import React, { useEffect, useState, useRef, useMemo } from "react";
import type { Paper } from "../../../schema/db-types";
import { useWorkbench } from "../context/WorkbenchContext";
import supabase from "../auth/supabaseClient";
import WebViewer from "@pdftron/pdfjs-express";

// PDF Viewer Component - displays a single paper
const PdfViewer: React.FC<{ paper: Paper; projectId: string }> = ({ paper, projectId }) => {
    const { setSelectedPaper } = useWorkbench();
    const viewerRef = useRef<HTMLDivElement>(null);
    const [instance, setInstance] = useState<WebViewer["Instance"] | null>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [retryCounter, setRetryCounter] = useState(0);

    const handleBackToLibrary = () => {
        setSelectedPaper(null);
    };

    // Fetch signed URL
    useEffect(() => {
        if (!paper || !projectId) return;
        setError(null);
        setSignedUrl(null);
        (async () => {
            setLoading(true);
            try {
                const { data, error: authErr } = await supabase.auth.getSession();
                if (authErr || !data?.session?.access_token) throw new Error("Not authenticated");

                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/papers/${paper.id}/signed-url?project_id=${encodeURIComponent(projectId)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${data.session.access_token}`,
                        },
                    }
                );
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Fetch failed: ${res.status} – ${text}`);
                }
                const { signed_url } = await res.json();
                setSignedUrl(signed_url);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        })();
    }, [paper, projectId, retryCounter]);

    // Init WebViewer
    useEffect(() => {
        if (viewerRef.current) {
            WebViewer(
                { path: "/webviewer", licenseKey: import.meta.env.VITE_PDFTRON_LICENSE_KEY },
                viewerRef.current
            ).then(async (inst: WebViewer["Instance"]) => {
                setInstance(inst);
                const { documentViewer, annotationManager } = inst.Core;

                inst.UI.setHeaderItems(function (header: any) {
                    header.getHeader("toolbarGroup-Annotate").delete("toolsOverlay");
                    const toolItems = header.getHeader("toolbarGroup-Annotate").getItems();
                    const items = header.getHeader("default").getItems().slice(0, -4);
                    const lastItems = header.getHeader("default").getItems().slice(-4);
                    const combined = [...items, ...toolItems, ...lastItems];
                    header.getHeader("default").update(combined);
                });

                // hide all ribbon tabs and tools header
                inst.UI.disableElements(["ribbons", "toolsHeader"]);

                inst.Core.documentViewer.addEventListener("documentLoadFailed", (evt: any) =>
                    console.error("PDF failed to load:", evt)
                );
                inst.UI.setZoomStepFactors([
                    { step: 2, startZoom: 0 },
                    { step: 5, startZoom: 50 },
                    { step: 7, startZoom: 100 },
                    { step: 15, startZoom: 200 },
                ]);

                documentViewer.addEventListener("documentLoaded", async () => {
                    setPageCount(documentViewer.getPageCount());
                    setCurrentPage(documentViewer.getCurrentPage());

                    // Load annotations from DB
                    try {
                        const { data, error } = await supabase
                            .from("project_paper_links")
                            .select("annotations")
                            .eq("project_id", projectId)
                            .eq("paper_id", paper.id)
                            .single();

                        if (error) throw error;

                        if (data?.annotations) {
                            await annotationManager.importAnnotations(data.annotations);
                        }
                    } catch (err) {
                        console.error("Error loading annotations:", err);
                    }
                });

                documentViewer.addEventListener("pageNumberUpdated", (pageNumber: number) => {
                    setCurrentPage(pageNumber);
                });

                annotationManager.addEventListener(
                    "annotationChanged",
                    async (_annotations: unknown, action: unknown) => {
                        const actionType = typeof action === "string" ? action : "";
                        if (["add", "modify", "delete"].includes(actionType)) {
                            const xfdf = await annotationManager.exportAnnotations();
                            try {
                                const { error } = await supabase
                                    .from("project_paper_links")
                                    .update({ annotations: xfdf })
                                    .eq("project_id", projectId)
                                    .eq("paper_id", paper.id);

                                if (error) throw error;
                            } catch (err) {
                                console.error("Error saving annotation:", err);
                            }
                        }
                    }
                );
            });
        }
        return () => {
            instance?.dispose();
            setInstance(null);
        };
    }, [projectId, paper]);

    // Load document when URL ready
    useEffect(() => {
        if (instance && signedUrl && paper) {
            instance.UI.loadDocument(signedUrl, {
                filename: paper.title,
            });
        }
    }, [instance, signedUrl, paper]);

    const retry = () => {
        setError(null);
        setRetryCounter((c) => c + 1);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Top Bar with Details + Controls */}
            <header className="flex items-center border-b border-gray-200 justify-between bg-white shadow-sm flex-none px-6 py-4">
                {/* Left: Back Button + Paper Details */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleBackToLibrary}
                        className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition"
                        title="Back to library"
                    >
                        <span className="material-icons text-2xl text-gray-700">arrow_back</span>
                    </button>
                    <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-800 truncate">
                            {paper.title}
                        </h3>
                    </div>
                </div>

                {/* Right: Page Nav & Zoom */}
                <div className="flex items-center space-x-3">
                    <a
                        href={signedUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open paper in new tab"
                        className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100"
                    >
                        <span className="material-icons text-gray-600">open_in_new</span>
                    </a>
                </div>
            </header>

            {/* Main PDF Viewer */}
            <div className="relative flex-1">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                            <p className="text-gray-600 text-sm">Loading PDF...</p>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50 p-4">
                        <span className="material-icons text-red-500 text-6xl mb-2">
                            error_outline
                        </span>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={retry}
                            className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all hover:cursor-pointer"
                        >
                            <span className="material-icons mr-2">refresh</span>
                            Retry
                        </button>
                    </div>
                )}
                <div
                    ref={viewerRef}
                    className="w-full h-full"
                    style={{ visibility: instance ? "visible" : "hidden" }}
                />

                {!loading && instance && (
                    <div className="absolute bottom-4 right-4 flex items-center space-x-1 rounded bg-white bg-opacity-80 px-2 py-1 text-xs text-gray-700 shadow-sm">
                        <span>
                            {currentPage} / {pageCount}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Library Home View Component - displays all papers in a table
const LibraryHomeView: React.FC = () => {
    const { papers, setSelectedPaper, projectId } = useWorkbench();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredPapers = useMemo(() => {
        if (!searchQuery.trim()) return papers;
        const q = searchQuery.toLowerCase();
        return papers.filter(
            (p) =>
                p.title?.toLowerCase().includes(q) ||
                p.authors?.some((a) => a.toLowerCase().includes(q)) ||
                p.doi?.toLowerCase().includes(q)
        );
    }, [papers, searchQuery]);

    const handlePaperClick = (paper: Paper) => {
        // Track last access time in localStorage
        const accessKey = `paper_access_${projectId}_${paper.id}`;
        localStorage.setItem(accessKey, Date.now().toString());

        setSelectedPaper(paper);
    };

    return (
        <div className="flex flex-col h-full bg-app-inner px-8 py-6">
            {/* Header */}
            <div className="flex-none mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <span className="material-icons text-4xl text-orange-600">
                            local_library
                        </span>
                        <h1 className="text-3xl font-semibold text-gray-900">My Library</h1>
                    </div>
                    <div className="text-sm text-gray-500">
                        {papers.length} {papers.length === 1 ? "paper" : "papers"}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-xl">
                    <span className="material-icons text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search by title, author, or year..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <span className="material-icons text-xl">close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Papers Table */}
            <div className="flex-1 overflow-y-auto">
                {filteredPapers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <span className="material-icons text-6xl mb-4">article</span>
                        <p className="text-lg">
                            {searchQuery ? "No papers match your search" : "No papers in your library"}
                        </p>
                        {!searchQuery && (
                            <p className="text-sm mt-2">
                                Upload papers from the sidebar to get started
                            </p>
                        )}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                                    Title
                                </th>
                                <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                                    Authors
                                </th>
                                <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 w-24">
                                    Year
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPapers.map((paper) => (
                                <tr
                                    key={paper.id}
                                    onClick={() => handlePaperClick(paper)}
                                    className="border-b border-gray-200 hover:bg-orange-50 cursor-pointer transition-colors"
                                >
                                    <td className="py-2 px-3 text-sm text-gray-900">
                                        {paper.title || "Untitled Paper"}
                                    </td>
                                    <td className="py-2 px-3 text-sm text-gray-600">
                                        {paper.authors && paper.authors.length > 0
                                            ? paper.authors.join(", ")
                                            : "—"}
                                    </td>
                                    <td className="py-2 px-3 text-sm text-gray-600">
                                        {paper.year || "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// Main LibraryViewer Component
const LibraryViewer: React.FC = () => {
    const { selectedPaper, projectId } = useWorkbench();

    // If a paper is selected, show the PDF viewer
    // Otherwise, show the library home view
    if (selectedPaper) {
        return <PdfViewer paper={selectedPaper} projectId={projectId} />;
    }

    return <LibraryHomeView />;
};

export default LibraryViewer;
