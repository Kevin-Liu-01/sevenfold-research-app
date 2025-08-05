// Fully upgraded ChatViewer.tsx with:
// - Project details integration via useWorkbench
// - Suggested questions
// - User & AI profile pictures
// - Modern orange+white UI with material icons

import React, { useState, useRef, useEffect } from "react";
import { useWorkbench } from "../context/WorkbenchContext";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  status?: "loading" | "error" | "sent";
}

const suggestions = [
  "What are key gaps in the related literature?",
  "Summarize this paper's contributions in 2 lines.",
  "Suggest follow-up experiments based on our topic.",
  "Help me create a new abstract for this project.",
];

const ChatViewer: React.FC = () => {
  const { papers } = useWorkbench();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Resize input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = (customText?: string) => {
    const text = (customText || inputValue).trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      status: "sent",
    };

    const placeholder: Message = {
      id: (Date.now() + 1).toString(),
      text: "Thinking...",
      isUser: false,
      timestamp: new Date(),
      status: "loading",
    };

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setInputValue("");
    setLoading(true);

    // Simulate async response
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholder.id
            ? {
                ...m,
                text: `Response to: "${text}"`,
                status: "sent",
              }
            : m
        )
      );
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white flex items-center justify-between px-6 py-4 border-b border-orange-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-icons text-orange-500">psychology</span>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Chat
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="material-icons text-base">folder</span>
          <span>{papers.length} papers loaded</span>
        </div>
      </header>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="p-6 m-6 rounded-2xl border-b border-kets-orange-200 bg-kets-orange-100 flex flex-wrap gap-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="bg-white border border-orange-200 text-orange-600 text-sm px-4 py-2 rounded-full hover:bg-orange-50 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat body */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-end gap-2 max-w-xl">
              {!msg.isUser && (
                <img
                  src="/branding/logo-sq.png"
                  alt="AI"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div
                className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border max-w-xl whitespace-pre-line
                  ${
                    msg.isUser
                      ? "bg-orange-500 text-white border-orange-300 rounded-br-none"
                      : "bg-gray-50 text-gray-800 border-gray-200 rounded-bl-none"
                  }`}
              >
                {msg.status === "loading" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 italic">
                      <span className="material-icons animate-spin text-sm">
                        autorenew
                      </span>
                      <span>Thinking...</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {papers.slice(0, 3).map((p, i) => (
                        <div
                          key={i}
                          className="text-xs bg-orange-100 text-orange-800 border border-orange-300 rounded-full px-2 py-1"
                        >
                          {p.filename || "Untitled"}
                        </div>
                      ))}
                      {papers.length > 3 && (
                        <div className="text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2 py-1">
                          +{papers.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <p>{msg.text}</p>
                    {!msg.isUser && msg.status === "sent" && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {papers.slice(0, 2).map((p, i) => (
                          <div
                            key={i}
                            className="text-xs bg-orange-100 text-orange-800 border border-orange-300 rounded-full px-2 py-1"
                          >
                            {p.filename || "Untitled"}
                          </div>
                        ))}
                        {papers.length > 2 && (
                          <div className="text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2 py-1">
                            +{papers.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              {msg.isUser && (
                <img
                  src="/branding/default-avatar.jpg"
                  alt="You"
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-kets-orange-200 p-4">
        <div className="flex items-center gap-3 bg-gray-50 border border-orange-200 rounded-2xl px-4 py-3 shadow-sm">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a research question..."
            className="flex-1 bg-transparent resize-none text-gray-900 placeholder-gray-400 text-base focus:outline-none"
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || loading}
            className="text-kets-orange-500 hover:text-kets-orange-700 transition disabled:opacity-30"
          >
            <span className="material-icons ">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatViewer;
