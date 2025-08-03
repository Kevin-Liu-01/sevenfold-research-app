import React, { useEffect, useState, useRef, useCallback } from "react";
import type { Paper } from "../../../database.types";
import supabase from "../../services/supabaseClient";
import WebViewer from "@pdftron/pdfjs-express";

interface PaperViewerProps {
    selectedPaper: Paper | null;
}

const PaperViewer: React.FC<PaperViewerProps> = ({ selectedPaper }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const initRef = useRef(false);
    const [instance, setInstance] = useState<any>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // PDF state
    const [pageCount, setPageCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [zoomLevel, setZoomLevel] = useState<number>(100);

    // Fetch signed URL
    useEffect(() => {
        if (!selectedPaper) return;
        setError(null);
        setSignedUrl(null);
        (async () => {
            setLoading(true);
            try {
                const { data, error: authErr } =
                    await supabase.auth.getSession();
                if (authErr || !data?.session?.access_token)
                    throw new Error("Not authenticated");

                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/papers/${selectedPaper.id}/signed-url`,
                    {
                        headers: {
                            Authorization: `Bearer ${data.session.access_token}`,
                        },
                    },
                );
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Fetch failed: ${res.status} – ${text}`);
                }
                const { signed_url } = await res.json();
                setSignedUrl(signed_url);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [selectedPaper]);

    // Init WebViewer
    useEffect(() => {
        if (viewerRef.current && !initRef.current) {
            initRef.current = true;
            WebViewer({ path: "/webviewer" }, viewerRef.current).then(
                (inst) => {
                    setInstance(inst);
                    inst.UI.disableElements(["ribbons", "toolsHeader"]);
                    inst.UI.setZoomStepFactors([
                        { step: 2, startZoom: 0 },
                        { step: 5, startZoom: 50 },
                        { step: 7, startZoom: 100 },
                        { step: 15, startZoom: 200 },
                    ]);
                    const dv = inst.Core.documentViewer;
                    dv.addEventListener("documentLoaded", () => {
                        setPageCount(dv.getPageCount());
                        setCurrentPage(dv.getCurrentPage());
                        dv.addEventListener("pageNumberUpdated", (e: any) => {
                            setCurrentPage(e.pageNumber);
                        });
                    });
                },
            );
        }
    }, []);

    // Load document when URL ready
    useEffect(() => {
        if (instance && signedUrl && selectedPaper) {
            instance.loadDocument(signedUrl, {
                filename: selectedPaper.filename,
            });
        }
    }, [instance, signedUrl, selectedPaper]);

    // Handlers
    const goToPage = useCallback(
        (delta: number) => {
            if (!instance) return;
            const next = Math.min(Math.max(1, currentPage + delta), pageCount);
            instance.UI.setCurrentPage(next);
        },
        [instance, currentPage, pageCount],
    );

    const zoom = useCallback(
        (factor: number) => {
            if (!instance) return;
            instance.UI.zoomTo(zoomLevel + factor);
            setZoomLevel((z) => Math.min(Math.max(10, z + factor), 400));
        },
        [instance, zoomLevel],
    );

    const retry = () => {
        setError(null);
        setSignedUrl(null);
    };

    if (!selectedPaper) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <span className="material-icons text-8xl text-orange-300 mb-4 animate-pulse">
                    description
                </span>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    No Paper Selected
                </h2>
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
                            {selectedPaper.filename}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                            {selectedPaper.authors && (
                                <span className="flex items-center space-x-1">
                                    <span className="material-icons text-base">
                                        people
                                    </span>
                                    <span>
                                        {selectedPaper.authors.join(", ")}
                                    </span>
                                </span>
                            )}
                            {selectedPaper.created_at && (
                                <span className="flex items-center space-x-1">
                                    <span className="material-icons text-base">
                                        calendar_today
                                    </span>
                                    <span>
                                        {new Date(
                                            selectedPaper.created_at,
                                        ).toLocaleDateString()}
                                    </span>
                                </span>
                            )}
                            {pageCount > 0 && (
                                <span className="flex items-center space-x-1">
                                    <span className="material-icons text-base">
                                        menu_book
                                    </span>
                                    <span>{pageCount} pages</span>
                                </span>
                            )}
                            <span className="flex items-center space-x-1">
                                <span className="material-icons text-base">
                                    note
                                </span>
                                <span>—</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Page Nav & Zoom */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => goToPage(-1)}
                        disabled={currentPage <= 1}
                        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        <span className="material-icons text-gray-600">
                            chevron_left
                        </span>
                    </button>
                    <span className="text-sm text-gray-700">
                        {currentPage} / {pageCount || "—"}
                    </span>
                    <button
                        onClick={() => goToPage(1)}
                        disabled={currentPage >= pageCount}
                        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        <span className="material-icons text-gray-600">
                            chevron_right
                        </span>
                    </button>

                    <div className="h-6 border-l border-gray-300" />

                    <a
                        href={signedUrl || "#"}
                        download={selectedPaper.filename}
                        className="p-2 rounded hover:bg-gray-100"
                    >
                        <span className="material-icons text-gray-600">
                            download
                        </span>
                    </a>
                </div>
            </header>

            {/* Keyword Bar (optional) */}
            {selectedPaper.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-2 bg-white px-6 py-2 border-b">
                    {selectedPaper.keywords.map((kw) => (
                        <span
                            key={kw}
                            className="px-3 py-0.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-full"
                        >
                            {kw}
                        </span>
                    ))}
                </div>
            )}

            {/* Main PDF Viewer */}
            <div className="relative flex-1">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <img
                            src="/images/logo-bw.png"
                            alt="Loading..."
                            className="w-auto h-20 animate-spin"
                        />
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
                        <span>•</span>
                        <span>{zoomLevel}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaperViewer;
