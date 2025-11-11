import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Composition } from "../../../schema/db-types";
import supabase from "../auth/supabaseClient";
import { useWorkbench } from "../context/WorkbenchContext";
import Editor from "@monaco-editor/react";
import { marked } from "marked";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import LatexPdfPreview from "../components/ui/LatexPdfPreview";
import TiptapEditor from "../components/ui/tiptap/TiptapEditor";

marked.setOptions({
    gfm: true,
    breaks: true,
});

// Add CSS for Monaco editor decorations
const editorStyles = `
.line-decoration-delete {
    background-color: rgba(248, 113, 113, 0.15);
}
.line-decoration-insert {
    background-color: rgba(134, 239, 172, 0.15);
}
.line-decoration-glyph-delete {
    background-color: #f87171;
    width: 3px !important;
    margin-left: 3px;
}
.line-decoration-glyph-insert {
    background-color: #86efac;
    width: 3px !important;
    margin-left: 3px;
}
.text-decoration-line-through {
    text-decoration: line-through;
    opacity: 0.6;
}
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('editor-decorations-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'editor-decorations-styles';
    styleElement.innerHTML = editorStyles;
    document.head.appendChild(styleElement);
}

// Constants
const DEFAULT_LATEX_TEMPLATE = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{Your Title Here}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Write your introduction here.

\\section{Methods}
Describe your methods.

\\section{Results}
Present your results.

\\section{Conclusion}
Summarize your findings.

\\end{document}`;

const MONACO_EDITOR_OPTIONS = {
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: "on" as const,
    lineNumbers: "on" as const,
    folding: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
};

// Helper Functions
const getAuthSession = async () => {
    const { data: { session }, error: authErr } = await supabase.auth.getSession();
    if (authErr || !session?.access_token) {
        throw new Error("Not authenticated");
    }
    return session;
};

const updateLastMessage = (
    prevMessages: Array<any>,
    updates: Partial<any>
): Array<any> => {
    const newMessages = [...prevMessages];
    const lastMsg = newMessages[newMessages.length - 1];
    newMessages[newMessages.length - 1] = {
        ...lastMsg,
        ...updates,
    };
    return newMessages;
};

// Types for edit proposals
interface EditOperation {
    type: 'insert' | 'delete' | 'replace';
    start_line: number;
    end_line: number;
    old_text?: string;
    new_text?: string;
}

interface EditProposal {
    id: string;
    section_name: string;
    operations: EditOperation[];
    rationale: string;
    status: 'pending' | 'accepted' | 'rejected';
}

// Types for search results
interface SearchResult {
    composition_title: string;
    composition_id: string;
    start_line: number;
    end_line: number;
    similarity: number;
    chunk_text: string;
}

interface SearchResultsData {
    query: string;
    results: SearchResult[];
}

// Inline Diff Summary Component (shown in chat)
const InlineDiffSummary: React.FC<{
    proposal: EditProposal;
    compositionName: string;
}> = ({ proposal, compositionName }) => {
    const addedLines = proposal.operations.reduce((sum, op) => {
        if (op.type === 'insert' || op.type === 'replace') {
            return sum + (op.new_text?.split('\n').length || 0);
        }
        return sum;
    }, 0);

    const deletedLines = proposal.operations.reduce((sum, op) => {
        if (op.type === 'delete' || op.type === 'replace') {
            return sum + (op.old_text?.split('\n').length || 0);
        }
        return sum;
    }, 0);

    if (proposal.status === 'accepted') {
        return (
            <div className="bg-green-50 border border-green-200 rounded px-2 py-1 mt-2 inline-flex items-center gap-1 text-xs">
                <span className="material-icons text-sm text-green-700">check_circle</span>
                <span className="text-green-700 font-medium">{compositionName} +{addedLines} -{deletedLines}</span>
            </div>
        );
    }

    if (proposal.status === 'rejected') {
        return (
            <div className="bg-red-50 border border-red-200 rounded px-2 py-1 mt-2 inline-flex items-center gap-1 text-xs">
                <span className="material-icons text-sm text-red-700">cancel</span>
                <span className="text-red-700 font-medium">{compositionName} +{addedLines} -{deletedLines}</span>
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

// Search Results Summary Component (shown in chat)
const SearchResultsSummary: React.FC<{
    searchData: SearchResultsData;
    onResultClick?: (compositionId: string, line: number) => void;
}> = ({ searchData, onResultClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg mt-2 text-xs overflow-hidden">
            {/* Header */}
            <div 
                className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <span className="material-icons text-sm text-purple-700">search</span>
                    <span className="text-purple-900 font-medium">
                        {searchData.results.length} result{searchData.results.length !== 1 ? 's' : ''} for "{searchData.query}"
                    </span>
                </div>
                <span className="material-icons text-sm text-purple-700">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
            </div>
            
            {/* Results (collapsible) */}
            {isExpanded && (
                <div className="border-t border-purple-200 bg-white max-h-64 overflow-y-auto">
                    {searchData.results.map((result, idx) => (
                        <div 
                            key={idx}
                            className="px-3 py-2 border-b border-purple-100 last:border-b-0 hover:bg-purple-50 cursor-pointer transition-colors"
                            onClick={() => onResultClick?.(result.composition_id, result.start_line)}
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="material-icons text-xs text-purple-600">description</span>
                                    <span className="font-medium text-purple-900 truncate">
                                        {result.composition_title}
                                    </span>
                                    <span className="text-purple-600 text-[10px] flex-shrink-0">
                                        Lines {result.start_line}-{result.end_line}
                                    </span>
                                </div>
                                <span className="text-[10px] text-purple-700 font-semibold bg-purple-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                    {(result.similarity * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="text-[11px] text-gray-600 line-clamp-2 font-mono bg-gray-50 px-2 py-1 rounded">
                                {result.chunk_text}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper function to parse search results from tool output
function parseSearchResults(resultText: string): SearchResult[] {
    const results: SearchResult[] = [];
    
    // Split by result entries (numbered format: "1. [Title] Lines X-Y")
    const resultBlocks = resultText.split(/\n(?=\d+\.\s*\[)/);
    
    for (const block of resultBlocks) {
        try {
            // Extract title: [Title]
            const titleMatch = block.match(/\[([^\]]+)\]/);
            if (!titleMatch) continue;
            const title = titleMatch[1];
            
            // Extract lines: Lines X-Y
            const linesMatch = block.match(/Lines\s+(\d+)-(\d+)/);
            if (!linesMatch) continue;
            const startLine = parseInt(linesMatch[1]);
            const endLine = parseInt(linesMatch[2]);
            
            // Extract similarity score: (score: 0.XX)
            const scoreMatch = block.match(/score:\s+([\d.]+)/);
            const similarity = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
            
            // Extract chunk text (everything after the metadata line)
            const lines = block.split('\n');
            const chunkText = lines.slice(1).join('\n').trim();
            
            if (title && chunkText) {
                results.push({
                    composition_title: title,
                    composition_id: '', // Not available in current format
                    start_line: startLine,
                    end_line: endLine,
                    similarity: similarity,
                    chunk_text: chunkText
                });
            }
        } catch (e) {
            console.error('Error parsing search result block:', e);
        }
    }
    
    return results;
}

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
        <div className="prose prose-xs max-w-none text-gray-800 leading-relaxed text-xs">
            {parts.map((part, index) => {
                if (part.startsWith("$$") && part.endsWith("$$")) {
                    // Render block-level math
                    return <BlockMath key={index}>{part.slice(2, -2)}</BlockMath>;
                } else if (part.startsWith("$") && part.endsWith("$")) {
                    // Render inline math
                    return <InlineMath key={index}>{part.slice(1, -1)}</InlineMath>;
                } else {
                    // This is a regular text part; parse it as Markdown
                    // Use parseInline for synchronous parsing
                    const html = marked.parseInline(part) as string;
                    // Render the HTML. It's safe because 'marked' sanitizes it.
                    return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
                }
            })}
        </div>
    );
};

// Writing Agent Chat Component
const WritingAgentChat: React.FC<{
    onEditProposalsChange: (proposals: EditProposal[]) => void;
}> = ({ onEditProposalsChange }) => {
    const { selectedComposition } = useWorkbench();
    const [messages, setMessages] = useState<Array<{ 
        role: 'user' | 'assistant', 
        content: string, 
        proposals?: EditProposal[],
        searchResults?: SearchResultsData,
        isSearching?: boolean,  // Track if currently searching
        isProposingEdits?: boolean  // Track if currently proposing edits
    }>>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false); // Only true before first content
    const [mode, setMode] = useState<'ask' | 'agent'>('ask');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Chat persists across composition changes - no reset
    // The backend will use the current selectedComposition.id when sending messages

    const handleSend = async () => {
        if (!input.trim() || isLoading || !selectedComposition?.id) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        setIsWaitingForResponse(true); // Waiting for first response

        try {
            const session = await getAuthSession();

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/compose/agent/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "text/event-stream",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        composition_id: selectedComposition.id,
                        message: userMessage,
                        conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
                        mode: mode,
                    }),
                }
            );

            if (!res.ok) {
                const txt = await res.text();
                console.error("Writing agent API error", res.status, txt);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: "Sorry — I couldn't process that request.",
                    },
                ]);
                setIsLoading(false);
                return;
            }

            // Handle streaming response
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";
            let hasCreatedMessage = false;
            let shouldCreateNewMessage = false; // Flag to create new message after tool results
            const messageProposals: EditProposal[] = [];
            let currentSearchQuery: string | null = null;
            let pendingProposalData: any = null; // Store proposal data until tool completes

            if (reader) {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split("\n");

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                try {
                                    const eventData = JSON.parse(line.slice(6));

                                    if (eventData.type === "content") {
                                        // First content received - stop waiting
                                        setIsWaitingForResponse(false);

                                        // Check if we should create a new message (after tool results)
                                        if (shouldCreateNewMessage) {
                                            // Create a new message for post-tool content
                                            assistantContent = eventData.text;
                                            setMessages((prev) => [
                                                ...prev,
                                                { role: 'assistant', content: assistantContent },
                                            ]);
                                            hasCreatedMessage = true;
                                            shouldCreateNewMessage = false;
                                        } else {
                                            // Normal content streaming
                                            assistantContent += eventData.text;
                                            
                                            if (!hasCreatedMessage) {
                                                setMessages((prev) => [
                                                    ...prev,
                                                    { role: 'assistant', content: assistantContent },
                                                ]);
                                                hasCreatedMessage = true;
                                            } else {
                                                setMessages((prev) => updateLastMessage(prev, {
                                                    role: 'assistant',
                                                    content: assistantContent,
                                                }));
                                            }
                                        }
                                    } else if (eventData.type === "tool_call") {
                                        if (eventData.tool === "propose_edits") {
                                            // Store proposal data to process when tool completes
                                            pendingProposalData = eventData.data;
                                            
                                            // Mark as proposing edits (show "Working..." indicator)
                                            if (!hasCreatedMessage) {
                                                setMessages((prev) => [
                                                    ...prev,
                                                    { role: 'assistant', content: assistantContent, isProposingEdits: true },
                                                ]);
                                                hasCreatedMessage = true;
                                            } else {
                                                setMessages((prev) => updateLastMessage(prev, { isProposingEdits: true }));
                                            }
                                        } else if (eventData.tool === "search_compositions") {
                                            // Store the search query and mark as searching
                                            currentSearchQuery = eventData.data?.query || 'compositions';
                                            
                                            if (!hasCreatedMessage) {
                                                setMessages((prev) => [
                                                    ...prev,
                                                    { role: 'assistant', content: assistantContent, isSearching: true },
                                                ]);
                                                hasCreatedMessage = true;
                                            } else {
                                                setMessages((prev) => updateLastMessage(prev, { isSearching: true }));
                                            }
                                        }
                                    } else if (eventData.type === "tool_result") {
                                        // Handle tool results - after tools complete, next content should be in a new message
                                        if (eventData.tool === "search_compositions" && currentSearchQuery) {
                                            // Parse search results from the tool output
                                            const searchResults = parseSearchResults(eventData.result);
                                            
                                            if (searchResults.length > 0) {
                                                const searchData: SearchResultsData = {
                                                    query: currentSearchQuery,
                                                    results: searchResults
                                                };
                                                
                                                // Update the assistant message with search results
                                                setMessages((prev) => updateLastMessage(prev, {
                                                    searchResults: searchData,
                                                    isSearching: false,
                                                }));
                                            }
                                            
                                            currentSearchQuery = null; // Reset after processing
                                        } else if (eventData.tool === "propose_edits" && pendingProposalData) {
                                            // Create the proposal now that the tool has completed
                                            const proposal: EditProposal = {
                                                id: `proposal_${Date.now()}_${Math.random()}`,
                                                section_name: pendingProposalData.section_name,
                                                operations: pendingProposalData.operations || [],
                                                rationale: pendingProposalData.rationale,
                                                status: 'pending'
                                            };
                                            
                                            messageProposals.push(proposal);
                                            // Notify parent of new proposal immediately
                                            onEditProposalsChange([proposal]);

                                            // Update current message with proposals and clear proposing state
                                            setMessages((prev) => updateLastMessage(prev, {
                                                proposals: [...messageProposals],
                                                isProposingEdits: false,
                                            }));
                                            
                                            pendingProposalData = null; // Reset after processing
                                        }
                                        
                                        // After any tool result, next content should go in a new message
                                        shouldCreateNewMessage = true;
                                    } else if (eventData.type === "done") {
                                        // Stream complete
                                    } else if (eventData.type === "error") {
                                        console.error("Streaming error:", eventData.message);
                                        if (!hasCreatedMessage) {
                                            setMessages((prev) => [
                                                ...prev,
                                                {
                                                    role: 'assistant',
                                                    content: "Sorry — I encountered an error.",
                                                },
                                            ]);
                                        }
                                    }
                                } catch (parseError) {
                                    console.error("Error parsing SSE data:", parseError, "Line:", line);
                                }
                            }
                        }
                    }
                } catch (streamError) {
                    console.error("Stream reading error:", streamError);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: "Sorry — there was a network error.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-app-inner">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <span className="material-icons-outlined text-3xl text-gray-300 mb-1">
                            {mode === 'ask' ? 'psychology' : 'auto_fix_high'}
                        </span>
                        <p className="text-xs text-gray-400">
                            {mode === 'ask' 
                                ? 'Ask me anything about your composition' 
                                : 'I can suggest edits to improve your writing'}
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <div key={idx}>
                                {msg.role === 'user' ? (
                                    <div className="flex justify-end">
                                        <div className="max-w-[90%] rounded-lg px-2.5 py-1.5 leading-relaxed bg-[var(--color-off-black)] text-white text-xs">
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Assistant message content */}
                                        {msg.content && (
                                            <div className="flex justify-start">
                                                <div className="max-w-[90%] rounded-lg px-2.5 py-1.5 leading-relaxed bg-white border border-gray-200 text-gray-700">
                                                    <MarkdownRenderer content={msg.content} />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Render edit proposals attached to this message */}
                                        {msg.proposals && msg.proposals.length > 0 && (
                                            <div className="ml-2 mt-1">
                                                {msg.proposals.map(proposal => (
                                                    <InlineDiffSummary
                                                        key={proposal.id}
                                                        proposal={proposal}
                                                        compositionName={selectedComposition?.title || 'Document'}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Render search results attached to this message */}
                                        {msg.searchResults && msg.searchResults.results.length > 0 && (
                                            <div className="ml-2 mt-1">
                                                <SearchResultsSummary
                                                    searchData={msg.searchResults}
                                                    onResultClick={(compositionId, line) => {
                                                        console.log('Navigate to:', compositionId, 'line', line);
                                                        // TODO: Implement navigation to composition and line
                                                    }}
                                                />
                                            </div>
                                        )}
                                        
                                        {/* Show searching indicator */}
                                        {msg.isSearching && (
                                            <div className="ml-2 mt-1">
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-300 border-t-purple-600"></div>
                                                    <span className="text-xs text-purple-700 font-medium">Searching...</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Show proposing edits indicator */}
                                        {msg.isProposingEdits && (
                                            <div className="ml-2 mt-1">
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-300 border-t-purple-600"></div>
                                                    <span className="text-xs text-purple-700 font-medium">Working...</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                        {isWaitingForResponse && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-gray-600"></div>
                                    <span className="text-xs text-gray-600 font-medium">Working...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200">
                <div className="flex items-end gap-2 mb-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={mode === 'ask' ? 'Ask a question...' : 'What to improve...'}
                        className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent bg-white placeholder-gray-400 text-xs"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-off-black)] text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span className="material-icons text-base">send</span>
                    </button>
                </div>
                
                {/* Mode Selector Dropdown - Minimalistic */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as 'ask' | 'agent')}
                            className="pl-2 pr-6 py-0.5 text-xs font-medium bg-transparent border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-transparent appearance-none cursor-pointer"
                        >
                            <option value="ask">Ask</option>
                            <option value="agent">Agent</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                            <span className="material-icons text-gray-400" style={{ fontSize: '12px' }}>
                                expand_more
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CompositionListPanel: React.FC<{
    compositions: Composition[];
    selectedComposition: Composition | null;
    onSelectComposition: (composition: Composition) => void;
    onNewComposition: () => void;
    isCreating: boolean;
    onEditProposalsChange: (proposals: EditProposal[]) => void;
}> = ({ compositions, selectedComposition, onSelectComposition, onNewComposition, isCreating, onEditProposalsChange }) => {

    return (
        <div className="w-64 bg-app-outer border-r border-gray-200 flex flex-col h-full">
            {/* Top Half - Composition List */}
            <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden min-h-0">
                <h3 className="text-sm font-semibold text-gray-800">Compositions</h3>
                <button
                    onClick={onNewComposition}
                    disabled={isCreating}
                    className="group inline-flex items-center space-x-1 bg-[var(--color-off-black)] text-[var(--color-app-inner)] text-sm font-medium px-2 py-1 rounded-md transition hover:opacity-90 disabled:opacity-50"
                >
                    {isCreating ? (
                        <span className="material-icons text-base animate-spin text-[var(--color-app-inner)] transition-transform duration-200 group-hover:scale-[1.15]">
                            refresh
                        </span>
                    ) : (
                        <span className="material-icons text-base text-[var(--color-app-inner)] transition-transform duration-200 group-hover:scale-[1.15]">
                            add
                        </span>
                    )}
                    <span>{isCreating ? "Creating..." : "New Composition"}</span>
                </button>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {compositions.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">No compositions found</div>
                    ) : (
                        <div className="flex flex-col space-y-2">
                            {compositions.map((composition) => (
                                <div
                                    key={composition.id}
                                    onClick={() => onSelectComposition(composition)}
                                    className={`flex items-center justify-between p-2 bg-app-inner rounded-md cursor-pointer transition
                                        ${selectedComposition?.id === composition.id ? "bg-gray-150 shadow" : "hover:bg-gray-300"}
                                    `}
                                >
                                    <div className="flex items-center space-x-1">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                                                {composition.title || "Untitled"}
                                            </span>
                                            <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                                {composition.type?.toUpperCase() || "UNKNOWN"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300"></div>

            {/* Bottom Half - Writing Agent Chat */}
            <div className="h-1/2 flex flex-col min-h-0">
                <WritingAgentChat onEditProposalsChange={onEditProposalsChange} />
            </div>
        </div>
    );
};

const EditorComponent: React.FC<{
    pendingProposals: EditProposal[];
    onAcceptProposal: (id: string, newContent: string) => void;
    onRejectProposal: (id: string) => void;
}> = ({ pendingProposals, onAcceptProposal, onRejectProposal }) => {
    const { selectedComposition, refreshCompositions } = useWorkbench();
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);
    const widgetsRef = useRef<any[]>([]);
    const [displayContent, setDisplayContent] = useState('');
    const finalContentRef = useRef(''); // Keep a ref to always get current value
    
    // Generate preview content with all pending proposals applied
    useEffect(() => {
        if (!selectedComposition?.contents) return;
        
        const original = selectedComposition.contents;
        
        if (pendingProposals.length === 0) {
            setDisplayContent(original);
            finalContentRef.current = original;
            return;
        }
        
        const allOps = pendingProposals.flatMap(p => p.operations || []);
        const sortedOps = [...allOps].sort((a, b) => b.start_line - a.start_line);
        
        // Create displayContent (keeps deleted lines for strikethrough display)
        let displayLines = original.split('\n');
        for (const op of sortedOps) {
            const startIdx = op.start_line - 1;
            const endIdx = op.end_line - 1;
            
            if (op.type === 'delete') {
                // Keep lines for display (will be marked red)
            } else if (op.type === 'insert' && op.new_text) {
                const newLines = op.new_text.split('\n');
                displayLines.splice(startIdx, 0, ...newLines);
            } else if (op.type === 'replace' && op.new_text) {
                const newLines = op.new_text.split('\n');
                // Keep old lines, add new ones after for display
                displayLines.splice(endIdx + 1, 0, ...newLines);
            }
        }
        setDisplayContent(displayLines.join('\n'));
        
        // Create finalContent (actually applies all operations including deletes)
        let finalLines = original.split('\n');
        for (const op of sortedOps) {
            const startIdx = op.start_line - 1;
            const endIdx = op.end_line - 1;
            
            if (op.type === 'delete') {
                finalLines.splice(startIdx, endIdx - startIdx + 1);
            } else if (op.type === 'insert' && op.new_text) {
                const newLines = op.new_text.split('\n');
                finalLines.splice(startIdx, 0, ...newLines);
            } else if (op.type === 'replace' && op.new_text) {
                const newLines = op.new_text.split('\n');
                finalLines.splice(startIdx, endIdx - startIdx + 1, ...newLines);
            }
        }
        const final = finalLines.join('\n');
        finalContentRef.current = final; // Update ref for button callbacks
    }, [selectedComposition?.contents, pendingProposals]);
    
    // Apply decorations and widgets for pending proposals
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) {
            return;
        }

        // Clear existing widgets
        widgetsRef.current.forEach(widget => {
            editorRef.current.removeContentWidget(widget);
        });
        widgetsRef.current = [];

        if (pendingProposals.length === 0) {
            // Clear decorations if no proposals
            if (decorationsRef.current.length > 0) {
                editorRef.current.deltaDecorations(decorationsRef.current, []);
                decorationsRef.current = [];
            }
            return;
        }

        const decorations: any[] = [];
        let lineOffset = 0; // Track line shifts from insertions

        pendingProposals.forEach(proposal => {
            // Add action widget for the first operation of each proposal
            if (proposal.operations && proposal.operations.length > 0) {
                const firstOp = proposal.operations[0];
                
                // Create widget element
                const widgetNode = document.createElement('div');
                widgetNode.className = 'inline-flex gap-1 items-center ml-2';
                widgetNode.style.cssText = 'background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
                
                const acceptBtn = document.createElement('button');
                acceptBtn.innerHTML = '✓';
                acceptBtn.className = 'hover:bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded transition';
                acceptBtn.title = 'Accept edit';
                acceptBtn.onclick = (e) => {
                    e.stopPropagation();
                    onAcceptProposal(proposal.id, finalContentRef.current);
                };
                
                const rejectBtn = document.createElement('button');
                rejectBtn.innerHTML = '✕';
                rejectBtn.className = 'hover:bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded transition';
                rejectBtn.title = 'Reject edit';
                rejectBtn.onclick = (e) => {
                    e.stopPropagation();
                    onRejectProposal(proposal.id);
                };
                
                widgetNode.appendChild(acceptBtn);
                widgetNode.appendChild(rejectBtn);
                
                const widget = {
                    getId: () => `edit-proposal-${proposal.id}`,
                    getDomNode: () => widgetNode,
                    getPosition: () => ({
                        position: { lineNumber: firstOp.start_line + lineOffset, column: 1 },
                        preference: [monacoRef.current.editor.ContentWidgetPositionPreference.EXACT]
                    })
                };
                
                editorRef.current.addContentWidget(widget);
                widgetsRef.current.push(widget);
            }

            // Sort operations for this proposal
            const sortedOps = [...(proposal.operations || [])].sort((a, b) => a.start_line - b.start_line);
            
            sortedOps.forEach(op => {
                if (op.type === 'delete') {
                    // Red background and strikethrough for lines to be deleted
                    decorations.push({
                        range: new monacoRef.current.Range(
                            op.start_line + lineOffset, 
                            1, 
                            op.end_line + lineOffset, 
                            Number.MAX_VALUE
                        ),
                        options: {
                            isWholeLine: true,
                            className: 'line-decoration-delete',
                            linesDecorationsClassName: 'line-decoration-glyph-delete',
                            inlineClassName: 'text-decoration-line-through',
                            minimap: {
                                color: '#fca5a5',
                                position: 2
                            }
                        }
                    });
                } else if (op.type === 'insert' && op.new_text) {
                    // Green background for newly inserted lines
                    const newLineCount = op.new_text.split('\n').length;
                    decorations.push({
                        range: new monacoRef.current.Range(
                            op.start_line + lineOffset, 
                            1, 
                            op.start_line + lineOffset + newLineCount - 1, 
                            Number.MAX_VALUE
                        ),
                        options: {
                            isWholeLine: true,
                            className: 'line-decoration-insert',
                            linesDecorationsClassName: 'line-decoration-glyph-insert',
                            minimap: {
                                color: '#86efac',
                                position: 2
                            }
                        }
                    });
                    lineOffset += newLineCount;
                } else if (op.type === 'replace' && op.new_text) {
                    // Red background for old lines (to be deleted)
                    decorations.push({
                        range: new monacoRef.current.Range(
                            op.start_line + lineOffset, 
                            1, 
                            op.end_line + lineOffset, 
                            Number.MAX_VALUE
                        ),
                        options: {
                            isWholeLine: true,
                            className: 'line-decoration-delete',
                            linesDecorationsClassName: 'line-decoration-glyph-delete',
                            inlineClassName: 'text-decoration-line-through',
                            minimap: {
                                color: '#fca5a5',
                                position: 2
                            }
                        }
                    });
                    
                    // Green background for new lines (replacement)
                    const newLineCount = op.new_text.split('\n').length;
                    decorations.push({
                        range: new monacoRef.current.Range(
                            op.end_line + lineOffset + 1, 
                            1, 
                            op.end_line + lineOffset + newLineCount, 
                            Number.MAX_VALUE
                        ),
                        options: {
                            isWholeLine: true,
                            className: 'line-decoration-insert',
                            linesDecorationsClassName: 'line-decoration-glyph-insert',
                            minimap: {
                                color: '#86efac',
                                position: 2
                            }
                        }
                    });
                    lineOffset += newLineCount;
                }
            });
        });

        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, decorations);
    }, [pendingProposals, onAcceptProposal, onRejectProposal, displayContent]);

    // If no composition is selected, show placeholder
    if (!selectedComposition) {
        return (
            <div className="flex flex-col h-full bg-gray-50 items-center justify-center">
                <div className="text-center">
                    <span className="material-icons text-6xl text-gray-300 mb-4">description</span>
                    <h3 className="text-xl font-medium text-gray-500 mb-2">No Composition Selected</h3>
                    <p className="text-gray-400">Select or create a composition to start editing</p>
                </div>
            </div>
        );
    }

    // state & refs
    const [mode, setMode] = useState<"docx" | "latex" | "markdown">(selectedComposition.type as "docx" | "latex" | "markdown");
    const [content, setContent] = useState(selectedComposition.contents || "");
    const [title, setTitle] = useState(selectedComposition.title || "Untitled");
    const [compileCounter, setCompileCounter] = useState(0);
    const [renderedHtml, setRenderedHtml] = useState("");
    const isInitialLoad = useRef(true);

    // Update state when selectedComposition changes
    useEffect(() => {
        if (selectedComposition) {
            setMode(selectedComposition.type as "docx" | "latex" | "markdown");
            setContent(selectedComposition.contents || "");
            setTitle(selectedComposition.title || "Untitled");
            isInitialLoad.current = true;
        }
    }, [selectedComposition?.id, selectedComposition?.contents]);

    // render markdown preview (debounce)
    useEffect(() => {
        const t = setTimeout(async () => {
            if (mode === "markdown") {
                const html = await marked.parse(content, {
                    gfm: true,
                    breaks: true,
                });
                setRenderedHtml(html);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [content, mode]);

    // Load full composition content
    useEffect(() => {
        if (!selectedComposition?.id) return;
        (async () => {
            try {
                const session = await getAuthSession();
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/compose/${selectedComposition.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );
                if (res.ok) {
                    const data = await res.json();
                    setContent(data.contents || "");
                    setTitle(data.title || "Untitled");
                    setMode(data.type as "docx" | "latex" | "markdown");
                }
            } catch (error) {
                console.error('Failed to load composition:', error);
            }
        })();
    }, [selectedComposition?.id]);

    // auto‑save (debounce)
    useEffect(() => {
        const t = setTimeout(() => {
            if (isInitialLoad.current) {
                isInitialLoad.current = false;
                return;
            }
            (async () => {
                if (!selectedComposition?.id) return;
                
                try {
                    const session = await getAuthSession();
                    const res = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/compose/update/${selectedComposition.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({ 
                                contents: content,
                                title: title,
                                type: mode
                            }),
                        }
                    );
                    
                    if (res.ok) {
                        // Refresh compositions list to show updated title/type
                        refreshCompositions();
                    }
                } catch (error) {
                    console.error('Failed to save composition:', error);
                }
            })();
        }, 1000);
        return () => clearTimeout(t);
    }, [content, title, mode, selectedComposition?.id, refreshCompositions]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* header */}
            <div className="flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-4 flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Composition title..."
                        className="text-xl font-semibold text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 rounded px-2 py-1 flex-1"
                    />
                </div>
                <div className="flex items-center space-x-3">
                    {mode === "latex" && (
                        <button
                            onClick={() => setCompileCounter(c => c + 1)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-off-black)] text-white rounded-lg hover:opacity-90 transition"
                            title="Compile LaTeX to PDF (Ctrl+Shift+B)"
                        >
                            <span className="material-icons text-base">play_arrow</span>
                            <span className="font-medium">Compile PDF</span>
                        </button>
                    )}
                    <div>
                        <label htmlFor="mode-select" className="sr-only">
                            Editor mode
                        </label>
                        <select
                            id="mode-select"
                            value={mode}
                            onChange={(e) => setMode(e.target.value as "docx" | "latex" | "markdown")}
                            className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
                        >
                            <option value="docx">Rich Text (DOCX)</option>
                            <option value="latex">LaTeX</option>
                            <option value="markdown">Markdown</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* editor content */}
            <div className="flex flex-1 overflow-hidden">
                {mode === "docx" ? (
                    /* Rich text editor (DOCX-like) - full width WYSIWYG */
                    <div className="flex-1">
                        <TiptapEditor
                            content={content}
                            onChange={(newContent) => setContent(newContent)}
                        />
                    </div>
                ) : mode === "markdown" ? (
                    /* Split view for Markdown: Monaco editor on left, rendered preview on right */
                    <>
                        <div className="w-1/2 flex flex-col border-r border-gray-200">
                            <label htmlFor="markdown-editor" className="sr-only">
                                Markdown editor
                            </label>
                            <Editor
                                height="100%"
                                language="markdown"
                                value={pendingProposals.length > 0 ? displayContent : content}
                                onChange={(value) => {
                                    if (pendingProposals.length === 0) {
                                        setContent(value || "");
                                    }
                                }}
                                onMount={(editor, monaco) => {
                                    editorRef.current = editor;
                                    monacoRef.current = monaco;
                                }}
                                theme="vs-light"
                                options={{
                                    ...MONACO_EDITOR_OPTIONS,
                                    readOnly: pendingProposals.length > 0,
                                }}
                            />
                        </div>
                        <div className="w-1/2 overflow-auto bg-white p-8">
                            <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            />
                        </div>
                    </>
                ) : (
                    /* Split view for LaTeX: Monaco editor on left, PDF preview on right */
                    <>
                        <div className="w-1/2 flex flex-col border-r border-gray-200">
                            <label htmlFor="editor-area" className="sr-only">
                                LaTeX editor
                            </label>
                            <Editor
                                height="100%"
                                language="latex"
                                value={pendingProposals.length > 0 ? displayContent : content}
                                onChange={(value) => {
                                    if (pendingProposals.length === 0) {
                                        setContent(value || "");
                                    }
                                }}
                                onMount={(editor, monaco) => {
                                    editorRef.current = editor;
                                    monacoRef.current = monaco;
                                }}
                                theme="vs-light"
                                options={{
                                    ...MONACO_EDITOR_OPTIONS,
                                    readOnly: pendingProposals.length > 0,
                                }}
                            />
                        </div>
                        <div className="w-1/2 overflow-auto bg-white">
                            <LatexPdfPreview 
                                compositionId={selectedComposition.id}
                                triggerCompile={compileCounter}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const ComposeViewer: React.FC = () => {
    const { projectId, compositions, selectedComposition, setSelectedComposition, refreshCompositions } = useWorkbench();
    const [isCreating, setIsCreating] = useState(false);
    const [editProposals, setEditProposals] = useState<EditProposal[]>([]);

    const handleSelectComposition = (composition: Composition) => {
        setSelectedComposition(composition);
        setEditProposals([]); // Clear proposals when switching compositions
    };

    const handleEditProposalsChange = useCallback((newProposals: EditProposal[]) => {
        // Merge new proposals with existing ones (avoid duplicates by id)
        setEditProposals(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewProposals = newProposals.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewProposals];
        });
    }, []);

    const handleAcceptProposal = useCallback(async (proposalId: string, newContent: string) => {
        const proposal = editProposals.find(p => p.id === proposalId);
        
        if (!proposal || !selectedComposition?.id) return;

        try {
            const session = await getAuthSession();

            // Save updated composition
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/compose/update/${selectedComposition.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ 
                        contents: newContent,
                    }),
                }
            );

            if (res.ok) {
                // Update composition immediately
                if (selectedComposition) {
                    selectedComposition.contents = newContent;
                }
                // Remove the accepted proposal
                setEditProposals(prev => prev.filter(p => p.id !== proposalId));
                refreshCompositions();
            }
        } catch (error) {
            console.error('Failed to apply edit:', error);
            alert('Failed to apply edit');
        }
    }, [editProposals, selectedComposition, refreshCompositions]);

    const handleRejectProposal = useCallback((proposalId: string) => {
        // Simply remove the rejected proposal without changing content
        setEditProposals(prev => prev.filter(p => p.id !== proposalId));
    }, []);

    const pendingProposals = editProposals.filter(p => p.status === 'pending');

    const createNewComposition = async () => {
        setIsCreating(true);
        try {
            const session = await getAuthSession();

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/compose/new_composition`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        type: "latex",
                        title: "",
                        contents: DEFAULT_LATEX_TEMPLATE,
                    }),
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to create composition: ${res.status} – ${text}`);
            }

            const newComposition = await res.json();
            setSelectedComposition(newComposition);
            await refreshCompositions();
        } catch (error: unknown) {
            console.error("Error creating composition:", error);
            alert(error instanceof Error ? error.message : "Failed to create composition");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex h-full bg-app-inner">
            <CompositionListPanel
                compositions={compositions}
                selectedComposition={selectedComposition}
                onSelectComposition={handleSelectComposition}
                onNewComposition={createNewComposition}
                isCreating={isCreating}
                onEditProposalsChange={handleEditProposalsChange}
            />
            <div className="flex-1">
                <EditorComponent 
                    pendingProposals={pendingProposals}
                    onAcceptProposal={handleAcceptProposal}
                    onRejectProposal={handleRejectProposal}
                />
            </div>
        </div>
    );
};

export default ComposeViewer;
