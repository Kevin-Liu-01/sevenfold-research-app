import React, { useEffect, useState, useRef } from "react";

import { useWorkbench } from "../context/WorkbenchContext";
import supabase from "../auth/supabaseClient";
import WebViewer from "@pdftron/pdfjs-express";

const SourcesViewer: React.FC = () => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [instance, setInstance] = useState<WebViewer["Instance"] | null>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { selectedPaper, projectId } = useWorkbench();

    // PDF state
    const [pageCount, setPageCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [retryCounter, setRetryCounter] = useState(0);

    // Fetch signed URL
    useEffect(() => {
        if (!selectedPaper || !projectId) return;
        setError(null);
        setSignedUrl(null);
        (async () => {
            setLoading(true);
            try {
                const { data, error: authErr } = await supabase.auth.getSession();
                if (authErr || !data?.session?.access_token) throw new Error("Not authenticated");

                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/papers/${selectedPaper.id}/signed-url?project_id=${encodeURIComponent(projectId)}`,
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
    }, [selectedPaper, projectId, retryCounter]);

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
                            .eq("paper_id", selectedPaper!.id)
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
                                    .eq("paper_id", selectedPaper!.id);

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
    }, [projectId, selectedPaper]);

    // Load document when URL ready
    useEffect(() => {
        if (instance && signedUrl && selectedPaper) {
            instance.UI.loadDocument(signedUrl, {
                filename: selectedPaper.title,
            });
        }
    }, [instance, signedUrl, selectedPaper]);

    // Handlers

    const retry = () => {
        setError(null);
        setRetryCounter((c) => c + 1);
    };

    if (!selectedPaper) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-app-inner">
                <span className="material-icons text-8xl text-orange-300 mb-4 animate-pulse">
                    description
                </span>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">No Paper Selected</h2>
                <p className="text-gray-600 text-sm">
                    Please select a paper from the list to begin.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Top Bar with Details + Controls */}
            <header className="flex items-center border-b border-gray-200 justify-between bg-white shadow-sm flex-none px-6 py-4">
                {/* Left: Paper Details */}
                <div className="flex items-start space-x-4">
                    <span className="material-icons text-3xl text-orange-600 mt-1">
                        insert_drive_file
                    </span>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 truncate">
                            {selectedPaper.title}
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
                        className="p-2 rounded hover:bg-gray-100"
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

export default SourcesViewer;
