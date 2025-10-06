/**
 * There are specific UI goals we are trying to accomplish. This is fundamentally
 * a "pager-style" chat interface where each user query and its
 * corresponding assistant response is treated as a single "page" or "slide".
 * The user navigates between these pages using arrows, the keyboard, or the
 * mouse wheel.
 *
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import supabase from "../auth/supabaseClient";
import { useWorkbench, ViewType } from "../context/WorkbenchContext";
import type { Paper, ChatConvo, ChatMessage } from "../../../schema/db-types";
import { marked } from "marked";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

marked.setOptions({
    gfm: true,
    breaks: true,
});

function ConvoHeader({ convo }: { convo: ChatConvo }) {
    return (
        <div className="sticky top-0 z-10 bg-app-inner/80 backdrop-blur border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                    {convo?.name || "Conversation"}
                </h2>
                <div className="text-xs text-gray-500">
                    Papers:{" "}
                    <span className="font-medium">
                        {Array.isArray(convo?.paper_ids) ? convo.paper_ids.length : 0}
                    </span>
                </div>
            </div>
        </div>
    );
}

const QueryResultTabs: React.FC<{
    active: "response" | "papers";
    onChange: (tab: "response" | "papers") => void;
    papersCount: number;
}> = ({ active, onChange, papersCount }) => {
    return (
        <div className="border-b border-gray-100 mb-3 flex gap-4 text-sm">
            {(["response", "papers"] as const).map((tab) => (
                <button
                    key={tab}
                    onClick={() => onChange(tab)}
                    className={`pb-1 ${
                        active === tab
                            ? "border-b-2 border-orange-500 text-orange-600 font-medium"
                            : "text-gray-500"
                    }`}
                >
                    {tab === "papers" ? `Papers (${papersCount})` : "Response"}
                </button>
            ))}
        </div>
    );
};

/**
 * Renders a string containing Markdown and LaTeX.
 * It splits the content by math delimiters ($...$ and $$...$$),
 * renders the math parts with react-katex, and renders the
 * non-math parts with the 'marked' library.
 */
const MarkdownRenderer: React.FC<{ content?: string }> = ({ content }) => {
    if (!content) return null;

    // Split the content by LaTeX delimiters. The regex captures the delimiters
    // so they are included in the resulting array.
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);

    return (
        // The `prose` class from Tailwind's typography plugin provides nice styling for rendered HTML.
        <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
            {parts.map((part, index) => {
                if (part.startsWith("$$") && part.endsWith("$$")) {
                    // Render block-level math
                    return <BlockMath key={index}>{part.slice(2, -2)}</BlockMath>;
                } else if (part.startsWith("$") && part.endsWith("$")) {
                    // Render inline math
                    return <InlineMath key={index}>{part.slice(1, -1)}</InlineMath>;
                } else {
                    // This is a regular text part; parse it as Markdown
                    const html = marked.parse(part);
                    // Render the HTML. It's safe because 'marked' sanitizes it.
                    return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
                }
            })}
        </div>
    );
};

const QueryResultBody: React.FC<{
    tab: "response" | "papers";
    response?: string;
    isPending: boolean;
    papers: Paper[];
    selectedPaperIds: string[];
    onSelectPaper: (paper: Paper) => void;
}> = ({ tab, response, isPending, papers, selectedPaperIds, onSelectPaper }) => {
    if (tab === "response") {
        return (
            <div>
                {isPending ? (
                    <div className="text-gray-400 text-base leading-relaxed">
                        <span className="mr-2">Thinking</span>
                        <span className="inline-flex items-center gap-1 align-middle">
                            <span className="animate-pulse">●</span>
                            <span className="animate-pulse [animation-delay:150ms]">●</span>
                            <span className="animate-pulse [animation-delay:300ms]">●</span>
                        </span>
                    </div>
                ) : (
                    <MarkdownRenderer content={response} />
                )}
            </div>
        );
    }
    if (tab === "papers") {
        const relevantPapers = papers.filter((p) => selectedPaperIds.includes(p.id));

        if (relevantPapers.length === 0) {
            return (
                <p className="text-sm text-gray-500">
                    No papers were associated with this response.
                </p>
            );
        }

        return (
            <div className="space-y-3">
                {relevantPapers.map((paper) => (
                    <div
                        key={paper.id}
                        onClick={() => onSelectPaper(paper)}
                        className="p-3 rounded-md border border-gray-200 hover:bg-gray-100 cursor-pointer transition"
                    >
                        <h4 className="font-medium text-sm text-gray-800 truncate">
                            {paper.title || "Untitled Paper"}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                            {paper.authors?.join(", ") || "Unknown authors"}
                        </p>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

const QueryResultCard: React.FC<{
    query: string;
    response?: string;
    isPending: boolean;
    papers: Paper[];
    selectedPaperIds: string[];
    tab: "response" | "papers";
    onTabChange: (tab: "response" | "papers") => void;
    onSelectPaper: (paper: Paper) => void;
}> = ({
    query,
    response,
    isPending,
    papers,
    selectedPaperIds,
    tab,
    onTabChange,
    onSelectPaper,
}) => {
    return (
        <div className="p-6 w-full h-full flex flex-col">
            {/* Card Header (Query + Tabs) */}
            <div className="flex-shrink-0">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 whitespace-pre-wrap">
                    {query}
                </h2>
                <QueryResultTabs
                    active={tab}
                    onChange={onTabChange}
                    papersCount={selectedPaperIds.length}
                />
            </div>

            {/* Scrollable content area */}
            <div className="flex-grow">
                {/* Wrapper adds padding to prevent last line of text from being hidden by the sticky footer */}
                <div className="pb-20">
                    <QueryResultBody
                        tab={tab}
                        response={response}
                        isPending={isPending}
                        papers={papers}
                        selectedPaperIds={selectedPaperIds}
                        onSelectPaper={onSelectPaper}
                    />
                </div>

                {/* Sticky Footer for Action Buttons */}
                {/* <div className="sticky bottom-0 bg-app-inner py-3 -mx-6 px-6">
                    <div className="flex gap-3 text-gray-400 text-sm">
                        <button className="hover:text-orange-600">
                            <span className="material-icons text-base">thumb_up</span>
                        </button>
                        <button className="hover:text-orange-600">
                            <span className="material-icons text-base">thumb_down</span>
                        </button>
                        <button className="hover:text-orange-600">
                            <span className="material-icons text-base">content_copy</span>
                        </button>
                    </div>
                </div> */}
            </div>
        </div>
    );
};

const QueryResultsPager: React.FC<{
    items: { query: string; response?: string; isPending: boolean }[];
    papers: Paper[];
    selectedPaperIds: string[];
    onSelectPaper: (paper: Paper) => void;
}> = ({ items, papers, selectedPaperIds, onSelectPaper }) => {
    const [tabs, setTabs] = useState<Record<number, "response" | "papers">>({});
    useEffect(() => {
        setTabs((old) => {
            const next = { ...old };
            for (let i = 0; i < items.length; i++) if (!next[i]) next[i] = "response";
            return next;
        });
    }, [items.length]);

    const [currentIndex, setCurrentIndex] = useState(Math.max(items.length - 1, 0));
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const scrollRaf = useRef<number | null>(null);

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, items.length);
    }, [items.length]);

    const scrollToIndex = useCallback(
        (index: number, behavior: ScrollBehavior = "smooth") => {
            const node = itemRefs.current[index];
            const container = containerRef.current;
            if (!node || !container) return;
            const marginTop =
                typeof window !== "undefined" ? parseFloat(window.getComputedStyle(node).marginTop) || 0 : 0;
            const targetTop = Math.max(node.offsetTop - marginTop, 0);
            container.scrollTo({ top: targetTop, behavior });
        },
        []
    );

    const goToIndex = useCallback(
        (updater: number | ((prev: number) => number), behavior: ScrollBehavior = "smooth") => {
            setCurrentIndex((prev) => {
                const raw = typeof updater === "function" ? updater(prev) : updater;
                const clamped = Math.max(0, Math.min(raw, items.length - 1));
                requestAnimationFrame(() => scrollToIndex(clamped, behavior));
                return clamped;
            });
        },
        [items.length, scrollToIndex]
    );

    const handlePrev = useCallback(() => goToIndex((prev) => prev - 1), [goToIndex]);
    const handleNext = useCallback(() => goToIndex((prev) => prev + 1), [goToIndex]);

    useEffect(() => {
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === "ArrowDown") {
                ev.preventDefault();
                handleNext();
            } else if (ev.key === "ArrowUp") {
                ev.preventDefault();
                handlePrev();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleNext, handlePrev]);

    const prevLengthRef = useRef(0);
    useEffect(() => {
        const prevLength = prevLengthRef.current;
        if (items.length === 0) {
            setCurrentIndex(0);
            if (containerRef.current) containerRef.current.scrollTo({ top: 0 });
            prevLengthRef.current = items.length;
            return;
        }
        if (items.length !== prevLength) {
            goToIndex(items.length - 1, prevLength === 0 ? "auto" : "smooth");
            prevLengthRef.current = items.length;
        }
    }, [items.length, goToIndex]);

    const handleScroll = useCallback(() => {
        if (scrollRaf.current !== null) cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = requestAnimationFrame(() => {
            const container = containerRef.current;
            if (!container) return;
            const scrollTop = container.scrollTop;
            let closestIndex = 0;
            let minDistance = Number.POSITIVE_INFINITY;
            itemRefs.current.forEach((node, index) => {
                if (!node) return;
                const distance = Math.abs(node.offsetTop - scrollTop);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                }
            });
            setCurrentIndex((prev) => (prev === closestIndex ? prev : closestIndex));
            scrollRaf.current = null;
        });
    }, []);

    useEffect(
        () => () => {
            if (scrollRaf.current !== null) cancelAnimationFrame(scrollRaf.current);
        },
        []
    );

    return (
        <div className="relative w-full h-[calc(100vh-12rem)]">
            <div
                ref={containerRef}
                className="h-full overflow-y-auto pr-2 no-scrollbar scroll-smooth"
                onScroll={handleScroll}
            >
                <div className="flex flex-col space-y-8">
                    {items.map((it, i) => (
                        <div
                            key={i}
                            ref={(el) => {
                                itemRefs.current[i] = el;
                            }}
                            className={`scroll-mt-4 ${i === items.length - 1 ? "min-h-[90vh]" : ""}`}
                        >
                            <QueryResultCard
                                query={it.query}
                                response={it.response}
                                isPending={it.isPending}
                                papers={papers}
                                selectedPaperIds={selectedPaperIds}
                                tab={tabs[i] ?? "response"}
                                onTabChange={(tab) => setTabs((t) => ({ ...t, [i]: tab }))}
                                onSelectPaper={onSelectPaper}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button
                    onClick={handlePrev}
                    disabled={items.length === 0 || currentIndex === 0}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                    ↑
                </button>
                <button
                    onClick={handleNext}
                    disabled={items.length === 0 || currentIndex === items.length - 1}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                    ↓
                </button>
            </div>
        </div>
    );
};

export const MessageList: React.FC<{
    messages: ChatMessage[];
    onSelectPaper: (paper: Paper) => void;
}> = ({ messages, onSelectPaper }) => {
    const { papers, selectedConvo } = useWorkbench();
    const items = useMemo(() => {
        const out: { query: string; response?: string; isPending: boolean }[] = [];
        let i = 0;
        while (i < messages.length) {
            const a = messages[i];
            if (a?.role !== "user") {
                i += 1;
                continue;
            }
            const b = messages[i + 1];
            if (b?.role === "assistant") {
                out.push({ query: a.data, response: b.data, isPending: false });
                i += 2;
            } else {
                out.push({ query: a.data, response: undefined, isPending: true });
                i += 1;
            }
        }
        return out;
    }, [messages]);

    const selectedPaperIds: string[] = Array.isArray(selectedConvo?.paper_ids)
        ? (selectedConvo!.paper_ids as string[])
        : [];

    return (
        <QueryResultsPager
            items={items}
            papers={papers}
            selectedPaperIds={selectedPaperIds}
            onSelectPaper={onSelectPaper}
        />
    );
};

const ChatInput: React.FC<{
    value: string;
    setValue: (v: string) => void;
    onSend: () => Promise<void>;
    disabled: boolean;
}> = ({ value, setValue, onSend, disabled }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full py-4 z-10">
            <div className="max-w-3xl mx-auto bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                <textarea
                    placeholder="Ask another question..."
                    className="w-full resize-none bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none"
                    rows={2}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                />
                <div className="flex justify-between items-center mt-3">
                    <div className="flex gap-2">
                        {/* Hidden non-functional buttons 
                        <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-full px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                            <span className="material-icons text-base">attach_file</span>
                            Source
                        </button>
                        <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-full px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                            <span className="material-icons text-base">mic</span>
                            Dictate
                        </button>
                        <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-full px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                            <span className="material-icons text-base">smart_toy</span>
                            Model
                        </button>
                        */}
                    </div>
                    <button
                        onClick={onSend}
                        disabled={disabled}
                        className="text-orange-500 hover:text-orange-700 transition disabled:opacity-30"
                    >
                        <span className="material-icons text-xl">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const NewChatPage: React.FC<{
    value: string;
    setValue: (v: string) => void;
    onSend: () => Promise<void>;
    papers: Paper[];
    selectedPaperIds: string[];
    togglePaper: (id: string) => void;
    disabled: boolean;
}> = ({ value, setValue, onSend, papers, selectedPaperIds, togglePaper, disabled }) => {
    return (
        <div className="min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center">
            <img
                src="/branding/logo-long.png"
                alt="Logo"
                className="text-4xl h-12 font-bold text-gray-900 mb-6"
            />
            <div className="w-full max-w-3xl bg-gray-50 border border-orange-200 min-h-32 rounded-xl p-4 shadow-sm">
                <textarea
                    placeholder="What are you researching today?"
                    className="w-full resize-none bg-transparent text-lg text-gray-800 placeholder-gray-400 focus:outline-none"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                    rows={2}
                    disabled={disabled}
                />
            </div>

            <div className="mt-6 text-left w-full max-w-3xl">
                <p className="text-sm font-medium text-gray-600 mb-2">Ingested Papers</p>
                <div className="flex flex-wrap gap-2">
                    {papers.map((paper) => (
                        <button
                            type="button"
                            key={paper.id}
                            onClick={() => togglePaper(paper.id)}
                            disabled={disabled}
                            className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition disabled:opacity-40
                                ${
                                    selectedPaperIds.includes(paper.id)
                                        ? "bg-orange-100 border-orange-300 text-orange-800"
                                        : "bg-gray-100 border-gray-300 text-gray-500"
                                }`}
                        >
                            {paper.title || "Untitled"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={onSend}
                    disabled={!value.trim() || disabled}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 disabled:opacity-30"
                >
                    <span className="material-icons">play_arrow</span>
                    Start chat
                </button>
            </div>
        </div>
    );
};

const ChatViewer: React.FC = () => {
    const {
        projectId,
        papers,
        selectedConvo,
        setSelectedConvo,
        refreshConvos,
        setSelectedPaper,
        setCurrentView,
    } = useWorkbench();

    const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(() =>
        papers.map((p) => p.id)
    );
    useEffect(() => setSelectedPaperIds(papers.map((p) => p.id)), [papers]);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!selectedConvo?.id) {
                setMessages([]);
                return;
            }
            const convoId = selectedConvo.id;

            const { data, error } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("convo_id", convoId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Failed to load messages:", error.message);
                setMessages((prev) =>
                    prev.filter((m) => m.convo_id === convoId && m.id.startsWith("local-"))
                );
                return;
            }

            const remote = (data ?? []) as ChatMessage[];
            setMessages((prev) => {
                const locals = prev.filter(
                    (m) => m.convo_id === convoId && m.id.startsWith("local-")
                );
                const merged = [...remote, ...locals];
                merged.sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                return merged;
            });
        };
        load();
    }, [selectedConvo?.id]);

    const togglePaper = (id: string) =>
        setSelectedPaperIds((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );

    const getPaperUris = useCallback(
        async (paperIds: string[]) => {
            if (!paperIds.length || !projectId) return [];

            const { data, error } = await supabase
                .from("project_paper_links")
                .select("paper_id, pdf_uri")
                .eq("project_id", projectId)
                .in("paper_id", paperIds)
                .not("pdf_uri", "is", null);

            if (error) {
                console.error("Error fetching paper URIs:", error);
                return [];
            }

            // adding type annotation here
            return (data || [])
                .map((item: { paper_id: string; pdf_uri: string | null }) => item.pdf_uri)
                .filter(Boolean);
        },
        [projectId]
    );

    const handleSelectPaper = (paper: Paper) => {
        setSelectedPaper(paper);
        setCurrentView(ViewType.Library);
    };

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;
        if (!projectId) return;

        setSending(true);
        try {
            let convoId = selectedConvo?.id;

            if (!convoId) {
                const { data, error } = await supabase
                    .from("chat_convos")
                    .insert({
                        project_id: projectId,
                        name: trimmed.slice(0, 120),
                        paper_ids: selectedPaperIds,
                    })
                    .select("*")
                    .single();

                if (error || !data) {
                    console.error("Error creating conversation:", error?.message);
                    return;
                }

                convoId = data.id as string;
                const userMsg: ChatMessage = {
                    id: `local-user-${Date.now()}`,
                    convo_id: convoId,
                    role: "user",
                    data: trimmed,
                    created_at: new Date().toISOString(),
                    metadata: {},
                };
                setMessages([userMsg]);
                setInput("");
                setSelectedConvo(data);
                await refreshConvos();
            } else {
                const userMsg: ChatMessage = {
                    id: `local-user-${Date.now()}`,
                    convo_id: convoId,
                    role: "user",
                    data: trimmed,
                    created_at: new Date().toISOString(),
                    metadata: {},
                };
                setMessages((prev) => [...prev, userMsg]);
                setInput("");
            }

            const paperUris = await getPaperUris(selectedPaperIds);
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/new_message`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    convo_id: convoId,
                    message: trimmed,
                    paper_uris: paperUris,
                }),
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error("Chat API error", res.status, txt);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `local-assistant-error-${Date.now()}`,
                        convo_id: convoId!,
                        role: "assistant",
                        data: "Sorry — I couldn’t process that request.",
                        created_at: new Date().toISOString(),
                        metadata: {},
                    },
                ]);
                return;
            }

            const data = await res.json();
            const assistantMsg: ChatMessage = {
                id: `local-assistant-${Date.now()}`,
                convo_id: convoId!,
                role: "assistant",
                data: data?.message ?? "…",
                created_at: new Date().toISOString(),
                metadata: {},
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (e) {
            console.error("Send error:", e);
        } finally {
            setSending(false);
        }
    }, [
        input,
        sending,
        projectId,
        selectedConvo?.id,
        selectedPaperIds,
        setSelectedConvo,
        refreshConvos,
        getPaperUris,
    ]);

    return (
        <div className="min-h-screen max-w-5xl mx-auto flex flex-col bg-app-inner">
            {!selectedConvo ? (
                <div className="flex-1 px-8 pt-10 pb-20">
                    <NewChatPage
                        value={input}
                        setValue={setInput}
                        onSend={sendMessage}
                        papers={papers}
                        selectedPaperIds={selectedPaperIds}
                        togglePaper={togglePaper}
                        disabled={sending}
                    />
                </div>
            ) : (
                <>
                    <ConvoHeader convo={selectedConvo} />
                    <MessageList messages={messages} onSelectPaper={handleSelectPaper} />
                    <ChatInput
                        value={input}
                        setValue={setInput}
                        onSend={sendMessage}
                        disabled={sending}
                    />
                </>
            )}
        </div>
    );
};

export default ChatViewer;
