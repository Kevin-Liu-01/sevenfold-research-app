import React, { useState, useRef, useEffect, useCallback } from "react";
import { useWorkbench } from "../context/WorkbenchContext";

// --- Toast Types ---
type Toast = { id: number; message: string; type: "success" | "error" };

const ChatViewer: React.FC = () => {
    const { papers } = useWorkbench();
    const [inputValue, setInputValue] = useState("");
    const [responses, setResponses] = useState<
        {
            query: string;
            response: string;
            tab: "response" | "papers" | "images" | "other";
        }[]
    >([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responseHeight, setResponseHeight] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(papers.map((p) => p.id));

    // --- Toast State & Handlers ---
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastIdRef = useRef(0);
    const addToast = (message: string, type: Toast["type"]) => {
        const id = ++toastIdRef.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    // --- File Upload Handlers ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFile = async (file: File) => {
        try {
            // TODO: replace with real upload logic
            console.log("Uploading file:", file.name);
            addToast(`Uploaded: ${file.name}`, "success");
        } catch (err) {
            console.error("Upload error:", err);
            addToast("File upload failed.", "error");
        }
    };

    const handleFiles = (files: FileList) => {
        Array.from(files).forEach(handleFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // --- API UTILITIES ---
    const fetchTabs = async () => {
        try {
            const res = await fetch("/tabs");
            if (!res.ok) throw new Error("Failed to fetch tabs");
            return await res.json();
        } catch (err) {
            console.error("Error fetching tabs:", err);
            addToast("Error loading conversations.", "error");
            return [];
        }
    };

    const fetchProjectTabs = async (projectId: string) => {
        try {
            const res = await fetch(`/tabs/project/${projectId}`);
            if (!res.ok) throw new Error("Failed to fetch project conversations");
            return await res.json();
        } catch (err) {
            console.error("Error fetching project tabs:", err);
            addToast("Could not load project conversations.", "error");
            return [];
        }
    };

    const fetchMessages = async (tabId: string) => {
        try {
            const res = await fetch(`/tabs/${tabId}/messages`);
            if (!res.ok) throw new Error("Failed to fetch messages");
            return await res.json();
        } catch (err) {
            console.error("Error loading conversation messages:", err);
            addToast("Failed to load messages.", "error");
            return [];
        }
    };

    const deleteTab = async (tabId: string) => {
        try {
            const res = await fetch(`/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: tabId }),
            });
            if (!res.ok) throw new Error("Failed to delete tab");
        } catch (err) {
            console.error("Delete failed:", err);
            addToast("Could not delete conversation.", "error");
        }
    };

    // --- SUBMIT MESSAGE ---
    const handleSubmit = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        setLoading(true);
        setResponses((prev) => [
            ...prev,
            { query: trimmed, response: "Thinking...", tab: "response" },
        ]);
        setInputValue("");

        try {
            const chatRes = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: trimmed,
                    paperIds: selectedPaperIds,
                    useEmbeddings: true,
                }),
            });

            if (!chatRes.ok) throw new Error("Chat request failed");

            const data = await chatRes.json();
            setResponses((prev) => {
                const updated = [...prev];
                updated[updated.length - 1].response = data.response || "No reply.";
                return updated;
            });
            setCurrentIndex((prev) => responses.length);
        } catch (err) {
            console.error("Chat error:", err);
            setResponses((prev) => {
                const updated = [...prev];
                updated[updated.length - 1].response = "Error: Could not process your request.";
                return updated;
            });
            addToast("Could not process request.", "error");
        } finally {
            setLoading(false);
        }
    };

    const togglePaperSelection = (id: string) => {
        setSelectedPaperIds((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    // --- HANDLE HEIGHT ---
    useEffect(() => {
        const el = responsesWrapperRef.current?.children[currentIndex] as HTMLElement;
        if (el) {
            setResponseHeight(el.offsetHeight);
        }
    }, [currentIndex, responses.length]);

    // refs for scroll & responses
    const responsesWrapperRef = useRef<HTMLDivElement>(null);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

    // --- SCROLL EVENTS ---
    useEffect(() => {
        const container = responsesWrapperRef.current?.parentElement?.parentElement;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (scrollTimeout.current) return;
            if (e.deltaY > 30) {
                setCurrentIndex((i) => Math.min(i + 1, responses.length - 1));
            } else if (e.deltaY < -30) {
                setCurrentIndex((i) => Math.max(i - 1, 0));
            }
            scrollTimeout.current = setTimeout(() => {
                scrollTimeout.current = null;
            }, 200);
        };

        container.addEventListener("wheel", handleWheel, { passive: true });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [responses.length]);

    // --- ARROW KEY SCROLL ---
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                setCurrentIndex((i) => Math.min(i + 1, responses.length - 1));
            } else if (e.key === "ArrowUp") {
                setCurrentIndex((i) => Math.max(i - 1, 0));
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [responses.length]);

    // --- LOAD INITIAL TAB/MESSAGES ---
    useEffect(() => {
        const loadInitial = async () => {
            const tabs = await fetchTabs();
            if (tabs.length > 0) {
                const messages = await fetchMessages(tabs[0].id);
                const conv = {
                    query: messages.find((m: any) => m.isUser)?.text || "User query",
                    response: messages.find((m: any) => !m.isUser)?.text || "AI response",
                    tab: "response" as const,
                };
                setResponses([conv]);
            }
        };
        loadInitial();
    }, []);

    return (
        <div
            className="min-h-screen max-w-5xl mx-auto flex justify-center bg-app-inner px-8 pt-10 pb-20"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`px-4 py-2 rounded-lg shadow-lg border text-white whitespace-nowrap ${
                            t.type === "success" ? "bg-green-500" : "bg-red-400 border-red-500"
                        }`}
                    >
                        <span className="material-icons align-middle mr-2">
                            {t.type === "success" ? "check_circle" : "error"}
                        </span>
                        {t.message}
                    </div>
                ))}
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            {responses.length === 0 && (
                <div className="flex flex-col w-full my-auto items-center text-center">
                    <img
                        src="/branding/logo-long.png"
                        className="text-4xl h-12 font-bold text-gray-900 mb-6"
                    />
                    <div className="w-full max-w-3xl bg-gray-50 border border-orange-200 rounded-xl p-4 shadow-sm">
                        <textarea
                            placeholder="What are you researching today?"
                            className="w-full resize-none bg-transparent text-lg text-gray-800 placeholder-gray-400 focus:outline-none"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            rows={2}
                        />
                        <div className="flex justify-end gap-3 mt-3">
                            <button className="text-gray-500 hover:text-orange-600">
                                <span className="material-icons">attach_file</span>
                            </button>
                            <button className="text-gray-500 hover:text-orange-600">
                                <span className="material-icons">mic</span>
                            </button>
                            <button className="text-gray-500 hover:text-orange-600">
                                <span className="material-icons">smart_toy</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 text-left w-full max-w-3xl">
                        <p className="text-sm font-medium text-gray-600 mb-2">Ingested Papers</p>
                        <div className="flex flex-wrap gap-2">
                            {papers.map((paper) => (
                                <div
                                    key={paper.id}
                                    onClick={() => togglePaperSelection(paper.id)}
                                    className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition
                    ${
                        selectedPaperIds.includes(paper.id)
                            ? "bg-orange-100 border-orange-300 text-orange-800"
                            : "bg-gray-100 border-gray-300 text-gray-500"
                    }`}
                                >
                                    {paper.filename || "Untitled"}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {responses.length > 0 && (
                <>
                    <div className="relative w-full h-[calc(100vh-12rem)] overflow-hidden">
                        <div
                            className="transition-transform duration-500 ease-in-out"
                            style={{
                                transform: `translateY(-${currentIndex * responseHeight}px)`,
                            }}
                        >
                            <div className="flex flex-col w-full" ref={responsesWrapperRef}>
                                {responses.map((r, i) => (
                                    <div key={i} className="p-6 w-full min-h-[calc(100vh-12rem)]">
                                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                            {r.query}
                                        </h2>
                                        <div className="border-b border-gray-100 mb-3 flex gap-4 text-sm">
                                            {["response", "papers", "images", "other"].map(
                                                (tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() =>
                                                            setResponses((res) =>
                                                                res.map((item, idx) =>
                                                                    idx === i
                                                                        ? {
                                                                              ...item,
                                                                              tab: tab as any,
                                                                          }
                                                                        : item
                                                                )
                                                            )
                                                        }
                                                        className={`pb-1 ${
                                                            r.tab === tab
                                                                ? "border-b-2 border-orange-500 text-orange-600 font-medium"
                                                                : "text-gray-500"
                                                        }`}
                                                    >
                                                        {tab === "papers"
                                                            ? `Papers (${selectedPaperIds.length})`
                                                            : tab[0].toUpperCase() + tab.slice(1)}
                                                    </button>
                                                )
                                            )}
                                        </div>

                                        {r.tab === "response" && (
                                            <p className="text-gray-800 whitespace-pre-line text-base leading-relaxed mb-4">
                                                {r.response}
                                            </p>
                                        )}

                                        {r.tab === "papers" && (
                                            <div className="text-sm text-gray-700 space-y-2 mb-4">
                                                {papers
                                                    .filter((p) => selectedPaperIds.includes(p.id))
                                                    .map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className="border border-gray-200 p-3 rounded-lg bg-white shadow-sm"
                                                        >
                                                            {p.filename || "Untitled Paper"}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        {r.tab === "images" && (
                                            <div className="text-sm text-gray-400 italic mb-4">
                                                (No images to display.)
                                            </div>
                                        )}

                                        {r.tab === "other" && (
                                            <div className="text-sm text-gray-400 italic mb-4">
                                                (No additional data.)
                                            </div>
                                        )}

                                        <div className="flex gap-3 text-gray-400 text-sm">
                                            <button className="hover:text-orange-600">
                                                <span className="material-icons text-base">
                                                    thumb_up
                                                </span>
                                            </button>
                                            <button className="hover:text-orange-600">
                                                <span className="material-icons text-base">
                                                    thumb_down
                                                </span>
                                            </button>
                                            <button className="hover:text-orange-600">
                                                <span className="material-icons text-base">
                                                    content_copy
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Input area */}
                    <div className="fixed bottom-0 left-0 w-full py-4 z-10">
                        <div className="max-w-3xl mx-auto bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                            <textarea
                                placeholder="Ask another question..."
                                className="w-full resize-none bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none"
                                rows={2}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                            />
                            <div className="flex justify-between items-center mt-3">
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-full px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                                        <span className="material-icons text-base">
                                            attach_file
                                        </span>
                                        File
                                    </button>
                                    <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-full px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                                        <span className="material-icons text-base">mic</span>
                                        Dictate
                                    </button>
                                    <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-full px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                                        <span className="material-icons text-base">smart_toy</span>
                                        Model
                                    </button>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!inputValue.trim() || loading}
                                    className="text-orange-500 hover:text-orange-700 transition disabled:opacity-30"
                                >
                                    <span className="material-icons text-xl">send</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Scroll controls */}
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button
                            onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            ↑
                        </button>
                        <button
                            onClick={() =>
                                setCurrentIndex((i) => Math.min(i + 1, responses.length - 1))
                            }
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            ↓
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatViewer;
