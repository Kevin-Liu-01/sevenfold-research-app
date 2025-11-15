import React, { useEffect, useRef, useState } from "react";
import { useWorkbench } from "../../context/WorkbenchContext";
import InlineDiffSummary from "./InlineDiffSummary";
import SearchResultsSummary from "./SearchResultsSummary";
import MarkdownRenderer from "./MarkdownRenderer";
import type { EditProposal, SearchResultsData, SearchResult, EditOperation } from "../../types/compose";
import { getAuthSession } from "../../utils/authSession";

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
    proposals?: EditProposal[];
    searchResults?: SearchResultsData;
    isSearching?: boolean;
    isProposingEdits?: boolean;
};

const updateLastMessage = (prevMessages: ChatMessage[], updates: Partial<ChatMessage>): ChatMessage[] => {
    const newMessages = [...prevMessages];
    const lastMsg = newMessages[newMessages.length - 1];
    newMessages[newMessages.length - 1] = {
        ...lastMsg,
        ...updates,
    };
    return newMessages;
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

// Writing Agent Chat Component
interface ToolProposalData {
    id: string;
    section_name: string;
    operations?: EditOperation[];
    rationale: string;
}

const WritingAgentChat: React.FC<{
    onEditProposalsChange: (proposals: EditProposal[]) => void;
}> = ({ onEditProposalsChange }) => {
    const { selectedComposition } = useWorkbench();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
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
            let pendingProposalData: ToolProposalData | null = null; // Store proposal data until tool completes
            let isStreamingContent = false; // Track if we're actively streaming text content
            let contentStreamTimeout: NodeJS.Timeout | null = null; // Timeout to detect when streaming pauses

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
                                        // First content received - stop waiting and mark as streaming
                                        setIsWaitingForResponse(false);
                                        isStreamingContent = true;
                                        
                                        // Clear any existing timeout
                                        if (contentStreamTimeout) {
                                            clearTimeout(contentStreamTimeout);
                                        }
                                        
                                        // Set a timeout to detect when streaming stops (agent is thinking/using tools)
                                        contentStreamTimeout = setTimeout(() => {
                                            if (hasCreatedMessage) {
                                                setMessages((prev) => updateLastMessage(prev, { isProposingEdits: true }));
                                            }
                                        }, 500); // 500ms without content = show working indicator

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
                                                    isProposingEdits: false, // Clear working indicator while streaming
                                                }));
                                            }
                                        }
                                    } else if (eventData.type === "tool_call") {
                                        // Clear the timeout since we got the tool call
                                        if (contentStreamTimeout) {
                                            clearTimeout(contentStreamTimeout);
                                            contentStreamTimeout = null;
                                        }
                                        
                                        // If we haven't created a message yet and not streaming, show working indicator
                                        if (!hasCreatedMessage && !isStreamingContent) {
                                            setMessages((prev) => [
                                                ...prev,
                                                { role: 'assistant', content: '', isProposingEdits: true },
                                            ]);
                                            hasCreatedMessage = true;
                                        }
                                        
                                        if (eventData.tool === "propose_edits") {
                                            // Store proposal data to process when tool completes
                                            pendingProposalData = eventData.data;
                                            
                                            // Mark as proposing edits (show "Working..." indicator)
                                            if (hasCreatedMessage) {
                                                setMessages((prev) => updateLastMessage(prev, { isProposingEdits: true }));
                                            }
                                        } else if (eventData.tool === "search_compositions") {
                                            // Store the search query and mark as searching
                                            currentSearchQuery = eventData.data?.query || 'compositions';
                                            
                                            if (hasCreatedMessage) {
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
                } finally {
                    // Clean up the timeout
                    if (contentStreamTimeout) {
                        clearTimeout(contentStreamTimeout);
                    }
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
                                                <div className="rounded-lg px-2.5 py-1.5 leading-relaxed bg-white border border-gray-200 text-gray-700">
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
                                    </>
                                )}
                            </div>
                        ))}
                        {(isWaitingForResponse || messages[messages.length - 1]?.isProposingEdits) && (
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

export default WritingAgentChat;
