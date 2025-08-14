import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import supabase from "../auth/supabaseClient";
import { useWorkbench } from "../context/WorkbenchContext";
import type { ChatConvo, ChatMessage } from "../../../schema/db-types";

/**
 * Subscribe to chat_messages for a convo and keep them ordered.
 * Fetches initial history and then streams INSERTs in realtime.
 */
function useConvoMessages(convoId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (!convoId) {
            setMessages([]);
            return;
        }

        let isCancelled = false;

        const load = async () => {
            const { data, error } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("convo_id", convoId)
                .order("created_at", { ascending: true });

            if (!isCancelled) {
                if (error) {
                    console.error("Failed to load messages:", error.message);
                    setMessages([]);
                } else {
                    setMessages((data ?? []) as ChatMessage[]);
                }
            }
        };

        load();

        const channel = supabase
            .channel(`chat_messages:${convoId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "chat_messages", filter: `convo_id=eq.${convoId}` },
                (payload) => {
                    const msg = payload.new as ChatMessage;
                    // de-dupe by id
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === msg.id)) return prev;
                        const next = [...prev, msg];
                        next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            isCancelled = true;
            supabase.removeChannel(channel);
        };
    }, [convoId]);

    return messages;
}

/** Small header for a convo */
function MessageHeader({ convo }: { convo: ChatConvo }) {
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

/** One bubble, fades in on mount */
function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const t = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const align = isUser ? "justify-end" : "justify-start";
    const bubble =
        message.role === "system"
            ? "bg-gray-100 text-gray-700 border border-gray-200"
            : isUser
            ? "bg-orange-500 text-white"
            : "bg-white text-gray-900 border border-gray-200";

    return (
        <div className={`w-full flex ${align} my-1 transition-all duration-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${bubble}`}>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{message.data}</pre>
            </div>
        </div>
    );
}

/** Scrollable list that sticks to bottom on new messages */
function MessageList({ messages }: { messages: ChatMessage[] }) {
    const scrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    return (
        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4">
            {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
            ))}
        </div>
    );
}

/** Bottom input bar (existing chat) */
function ChatInput({
    value,
    setValue,
    onSend,
    disabled,
}: {
    value: string;
    setValue: (v: string) => void;
    onSend: () => Promise<void>;
    disabled: boolean;
}) {
    return (
        <div className="border-t border-gray-200 bg-app-inner px-4 py-3">
            <div className="max-w-3xl mx-auto bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                <textarea
                    placeholder="Ask something..."
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
                    disabled={disabled}
                />
                <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-full px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-40" disabled={disabled}>
                            <span className="material-icons text-base">attach_file</span>
                            File
                        </button>
                        <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-full px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-40" disabled={disabled}>
                            <span className="material-icons text-base">mic</span>
                            Dictate
                        </button>
                    </div>
                    <button
                        onClick={onSend}
                        disabled={!value.trim() || disabled}
                        className="text-orange-500 hover:text-orange-700 transition disabled:opacity-30"
                        title="Send"
                    >
                        <span className="material-icons text-xl">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/** New chat landing screen */
function NewChatPage({
    value,
    setValue,
    onSend,
    papers,
    selectedPaperIds,
    togglePaper,
    disabled,
}: {
    value: string;
    setValue: (v: string) => void;
    onSend: () => Promise<void>;
    papers: { id: string; title?: string; filename?: string }[];
    selectedPaperIds: string[];
    togglePaper: (id: string) => void;
    disabled: boolean;
}) {
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

// -----------------------------------------------------------------------------
// Container
// -----------------------------------------------------------------------------

const ChatViewer: React.FC = () => {
    const { projectId, papers, selectedConvo, setSelectedConvo, refreshConvos } = useWorkbench();

    const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(() => papers.map((p) => p.id));
    useEffect(() => setSelectedPaperIds(papers.map((p) => p.id)), [papers]);

    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    // messages stream
    const messages = useConvoMessages(selectedConvo?.id ?? null);

    const togglePaper = (id: string) =>
        setSelectedPaperIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;
        if (!projectId) return;

        setSending(true);
        try {
            // Ensure a convo exists
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
                    setSending(false);
                    return;
                }

                convoId = data.id as string;
                setSelectedConvo(data);
                await refreshConvos();
            }

            // Hit API – it will write both user + assistant messages.
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/new_message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tab_id: convoId, message: trimmed }),
            }).catch((e) => {
                console.error("Chat request failed:", e);
            });

            setInput(""); // clear input; new messages will arrive via realtime
        } finally {
            setSending(false);
        }
    }, [input, sending, projectId, selectedConvo?.id, selectedPaperIds, setSelectedConvo, refreshConvos]);

    const isNewChat = !selectedConvo;
    const paperCount = useMemo(
        () => (Array.isArray(selectedConvo?.paper_ids) ? selectedConvo!.paper_ids.length : selectedPaperIds.length),
        [selectedConvo?.paper_ids, selectedPaperIds.length]
    );

    return (
        <div className="min-h-screen max-w-5xl mx-auto flex flex-col bg-app-inner">
            {isNewChat ? (
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
                    <MessageHeader convo={selectedConvo} />
                    <MessageList messages={messages} />
                    <ChatInput value={input} setValue={setInput} onSend={sendMessage} disabled={sending} />
                </>
            )}
        </div>
    );
};

export default ChatViewer;
