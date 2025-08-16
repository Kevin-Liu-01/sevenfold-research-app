import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import supabase from "../auth/supabaseClient";
import { useWorkbench } from "../context/WorkbenchContext";
import type { Paper, ChatConvo, ChatMessage } from "../../../schema/db-types";

function ConvoHeader({ convo }: { convo: ChatConvo }) {
    return (
        <div className="sticky top-0 z-10 bg-app-inner/80 backdrop-blur border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">{convo?.name || "Conversation"}</h2>
                <div className="text-xs text-gray-500">
                    Papers: <span className="font-medium">{Array.isArray(convo?.paper_ids) ? convo.paper_ids.length : 0}</span>
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

const QueryResultBody: React.FC<{
    tab: "response" | "papers";
    response?: string;           // undefined while pending
    isPending: boolean;
    papers: { id: string; title?: string; filename?: string }[];
    selectedPaperIds: string[];
}> = ({ tab, response, isPending, papers, selectedPaperIds }) => {
    if (tab === "response") {
        return (
            <div className="mb-4">
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
                    <p className="text-gray-800 whitespace-pre-line text-base leading-relaxed">
                        {response}
                    </p>
                )}
            </div>
        );
    }

    // Papers tab
    return (
        <div className="text-sm text-gray-700 space-y-2 mb-4">
            {selectedPaperIds.length === 0 && (
                <div className="text-sm text-gray-400 italic mb-4">
                    (No papers selected.)
                </div>
            )}
            {papers
                .filter((p) => selectedPaperIds.includes(p.id))
                .map((p) => (
                    <div
                        key={p.id}
                        className="border border-gray-200 p-3 rounded-lg bg-white shadow-sm"
                    >
                        {p.filename || p.title || "Untitled Paper"}
                    </div>
                ))}
        </div>
    );
};

const QueryResultCard: React.FC<{
    query: string;
    response?: string;
    isPending: boolean;
    papers: { id: string; title?: string; filename?: string }[];
    selectedPaperIds: string[];
    tab: "response" | "papers";
    onTabChange: (tab: "response" | "papers") => void;
}> = ({ query, response, isPending, papers, selectedPaperIds, tab, onTabChange }) => {
    return (
        <div className="p-6 w-full min-h-[calc(100vh-12rem)]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2 whitespace-pre-wrap">
                {query}
            </h2>

            <QueryResultTabs
                active={tab}
                onChange={onTabChange}
                papersCount={selectedPaperIds.length}
            />

            <QueryResultBody
                tab={tab}
                response={response}
                isPending={isPending}
                papers={papers}
                selectedPaperIds={selectedPaperIds}
            />

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
        </div>
    );
};

const QueryResultsPager: React.FC<{
    items: { query: string; response?: string; isPending: boolean }[];
    papers: { id: string; title?: string; filename?: string }[];
    selectedPaperIds: string[];
}> = ({ items, papers, selectedPaperIds }) => {
    const [tabs, setTabs] = useState<Record<number, "response" | "papers">>({});
    useEffect(() => {
        setTabs((old) => {
            const next = { ...old };
            for (let i = 0; i < items.length; i++) if (!next[i]) next[i] = "response";
            return next;
        });
    }, [items.length]);

    // Always focus the newest item
    const [currentIndex, setCurrentIndex] = useState(Math.max(items.length - 1, 0));
    useEffect(() => {
        setCurrentIndex(Math.max(items.length - 1, 0));
    }, [items.length]);

    // Measure current slide height for translate
    const [pageHeight, setPageHeight] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = wrapperRef.current?.children[currentIndex] as HTMLElement | null;
        if (el) setPageHeight(el.offsetHeight);
    }, [currentIndex, items, tabs]);

    // Mouse wheel navigation (throttled & jitter-filtered)
    const lastScrollRef = useRef(0);
    const handleWheel = useCallback(
        (e: React.WheelEvent<HTMLDivElement>) => {
            e.stopPropagation();
            const now = Date.now();
            if (now - lastScrollRef.current < 160) return;
            if (Math.abs(e.deltaY) < 12) return;
            if (e.deltaY > 0) {
                setCurrentIndex((i) => Math.min(i + 1, items.length - 1));
            } else {
                setCurrentIndex((i) => Math.max(i - 1, 0));
            }
            lastScrollRef.current = now;
        },
        [items.length]
    );

    // Keyboard arrows
    useEffect(() => {
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === "ArrowDown") {
                setCurrentIndex((i) => Math.min(i + 1, items.length - 1));
            } else if (ev.key === "ArrowUp") {
                setCurrentIndex((i) => Math.max(i - 1, 0));
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [items.length]);

    return (
        <div
            className="relative w-full h-[calc(100vh-12rem)] overflow-hidden"
            onWheel={handleWheel}
        >
            <div
                className="transition-transform duration-500 ease-in-out"
                style={{ transform: `translateY(-${currentIndex * pageHeight}px)` }}
            >
                <div className="flex flex-col w-full" ref={wrapperRef}>
                    {items.map((it, i) => (
                        <QueryResultCard
                            key={i}
                            query={it.query}
                            response={it.response}
                            isPending={it.isPending}
                            papers={papers}
                            selectedPaperIds={selectedPaperIds}
                            tab={tabs[i] ?? "response"}
                            onTabChange={(tab) => setTabs((t) => ({ ...t, [i]: tab }))}
                        />
                    ))}
                </div>
            </div>

            {/* On-screen arrows */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button
                    onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    ↑
                </button>
                <button
                    onClick={() => setCurrentIndex((i) => Math.min(i + 1, items.length - 1))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    ↓
                </button>
            </div>
        </div>
    );
};

export const MessageList: React.FC<{
    messages: ChatMessage[];
}> = ({ messages }) => {
    const { papers, selectedConvo } = useWorkbench();

    // Build list for the pager with optimistic pending card:
    // - Only start a card on a user message
    // - If immediately followed by assistant, it's ready
    // - If not, it's pending (shows thinking until assistant arrives)
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
        />
    );
};
const ChatInput: React.FC<{
     value: string;
     setValue: (v: string) => void;
     onSend: () => Promise<void>;
     disabled: boolean;
}> = ({value, setValue, onSend, disabled }) => {
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
                        <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-full px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                            <span className="material-icons text-base">
                                attach_file
                            </span>
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
}

const NewChatPage: React.FC<{
    value: string,
    setValue: (v: string) => void,
    onSend: () => Promise<void>,
    papers: Paper[];
    selectedPaperIds: string[],
    togglePaper: (id: string) => void,
    disabled: boolean,
}> = ({ value, setValue, onSend, papers, selectedPaperIds, togglePaper, disabled }) => {
    return (
        <div className="min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center">
            <img src="/branding/logo-long.png" className="text-4xl h-12 font-bold text-gray-900 mb-6" />
            <div className="w-full max-w-3xl bg-gray-50 border border-orange-200 rounded-xl p-4 shadow-sm">
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
                <div className="flex justify-end gap-3 mt-3">
                    <button className="text-gray-500 hover:text-orange-600 disabled:opacity-40" disabled={disabled}>
                        <span className="material-icons">attach_file</span>
                    </button>
                    <button className="text-gray-500 hover:text-orange-600 disabled:opacity-40" disabled={disabled}>
                        <span className="material-icons">mic</span>
                    </button>
                    <button className="text-gray-500 hover:text-orange-600 disabled:opacity-40" disabled={disabled}>
                        <span className="material-icons">smart_toy</span>
                    </button>
                </div>
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
                            {paper.title || paper.filename || "Untitled"}
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
}


const ChatViewer: React.FC = () => {
    const { projectId, papers, selectedConvo, setSelectedConvo, refreshConvos } = useWorkbench();

    const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(() => papers.map((p) => p.id));
    useEffect(() => setSelectedPaperIds(papers.map((p) => p.id)), [papers]);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [awaitingAssistant, setAwaitingAssistant] = useState(false);


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
                    (a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                return merged;
            });
        };
        load();
    }, [selectedConvo?.id]);

    const togglePaper = (id: string) =>
        setSelectedPaperIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;
        if (!projectId) return;

        setSending(true);
        setAwaitingAssistant(true);
        try {
            let convoId = selectedConvo?.id;

            // Create convo if needed
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
                    setAwaitingAssistant(false);
                    return;
                }

                convoId = data.id as string;

                // 1) Optimistically append the FIRST user message *before* switching view
                const userMsg: ChatMessage = {
                    id: `local-user-${Date.now()}`,
                    convo_id: convoId,
                    role: "user",
                    data: trimmed,
                    created_at: new Date().toISOString(),
                    metadata: {},
                };
                setMessages([userMsg]); // fresh thread: start with first message
                setInput("");

                // 2) Switch to the convo (header etc.)
                setSelectedConvo(data);
                await refreshConvos();
            } else {
                // Existing convo: optimistic user message as usual
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

            // Hit API – server writes both messages; we animate assistant on return
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/new_message`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ convo_id: convoId, message: trimmed, paper_ids: null }),
            });

            if (!res.ok) {
                const txt = await res.text();
                try {
                    console.error("Chat API error", res.status, JSON.parse(txt));
                } catch {
                    console.error("Chat API error", res.status, txt);
                }
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
                setAwaitingAssistant(false);
                return;
            }

            const data = await res.json();
            const assistantText: string = data?.message ?? "…";

            const assistantMsg: ChatMessage = {
                id: `local-assistant-${Date.now()}`,
                convo_id: convoId!,
                role: "assistant",
                data: assistantText,
                created_at: new Date().toISOString(),
                metadata: {},
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (e) {
            console.error("Send error:", e);
        } finally {
            setAwaitingAssistant(false);
            setSending(false);
        }
    }, [input, sending, projectId, selectedConvo?.id, selectedPaperIds, setSelectedConvo, refreshConvos]);

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
                    <MessageList messages={messages} awaitingAssistant={awaitingAssistant} />
                    <ChatInput value={input} setValue={setInput} onSend={sendMessage} disabled={sending} />
                </>
            )}
        </div>
    );
};

export default ChatViewer;
