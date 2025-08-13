import React, { createContext, useContext, useState, useRef, useEffect } from "react";

export type ChatMessage = {
    role: "user" | "ai";
    content: string;
    sources: string[];
    timestamp?: Date;
    model?: string;
};

export type Conversation = {
    id: string;
    name: string;
    messages: ChatMessage[];
    model: string;
    timestamp: Date;
};

interface ChatContextType {
    messages: ChatMessage[];
    input: string;
    setInput: (v: string) => void;
    sendMessage: (msg?: string) => void;
    suggestions: string[];
    setSuggestions: (s: string[]) => void;
    clear: () => void;
    regenerate: () => void;
    copyLast: () => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    conversations: Conversation[];
    saveConversation: (name: string) => void;
    loadConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
    isTyping: boolean;
}

const MOCK_SUGGESTIONS = [
    "What can you do?",
    "Summarize this paper",
    "Show me recent research",
    "How does this work?",
    "Help me write a research proposal",
    "Explain machine learning concepts",
    "Analyze this data",
    "Create a project timeline",
];

const AI_RESPONSES = [
    "I'm an AI assistant designed to help with research, writing, and analysis. I can help you with academic papers, data analysis, project planning, and much more. What would you like to work on?",
    "That's an interesting question! Let me break this down for you and provide some insights based on current research and best practices.",
    "I'd be happy to help you with that. Here's what I can offer based on your request:",
    "Great question! Here's my analysis and some recommendations:",
    "I can definitely help you with that. Let me provide you with a comprehensive response:",
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>(MOCK_SUGGESTIONS);
    const [selectedModel, setSelectedModel] = useState("gpt-4");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    // Load conversations from localStorage on mount
    useEffect(() => {
        const savedConversations = localStorage.getItem("chat_conversations");
        if (savedConversations) {
            try {
                const parsed = JSON.parse(savedConversations);
                setConversations(
                    parsed.map((conv: any) => ({
                        ...conv,
                        timestamp: new Date(conv.timestamp),
                    }))
                );
            } catch (error) {
                console.error("Error loading conversations:", error);
            }
        }
    }, []);

    // Save conversations to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("chat_conversations", JSON.stringify(conversations));
    }, [conversations]);

    const generateAIResponse = (userMessage: string): string => {
        const responses = [
            `Thank you for your question about "${userMessage}". ${AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)]}`,
            `I understand you're asking about "${userMessage}". Let me provide you with a detailed response. ${AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)]}`,
            `Great question! Regarding "${userMessage}", here's what I can tell you. ${AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)]}`,
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const sendMessage = async (msg?: string) => {
        const text = typeof msg === "string" ? msg : input;
        if (!text.trim()) return;

        const userMessage: ChatMessage = {
            role: "user",
            content: text,
            sources: [],
            timestamp: new Date(),
            model: selectedModel,
        };

        setMessages((msgs) => [...msgs, userMessage]);
        setInput("");
        setIsTyping(true);

        // Simulate AI response delay
        setTimeout(
            () => {
                const aiResponse: ChatMessage = {
                    role: "ai",
                    content: generateAIResponse(text),
                    sources: ["arxiv.org/abs/1234.5678", "research.example.com"],
                    timestamp: new Date(),
                    model: selectedModel,
                };
                setMessages((msgs) => [...msgs, aiResponse]);
                setIsTyping(false);
            },
            1500 + Math.random() * 1000
        );
    };

    const clear = () => setMessages([]);

    const regenerate = () => {
        if (messages.length === 0) return;
        const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
        if (lastUserMessage) {
            // Remove the last AI response and regenerate
            setMessages((msgs) => msgs.filter((_, i) => i < msgs.length - 1));
            setTimeout(() => {
                const aiResponse: ChatMessage = {
                    role: "ai",
                    content: generateAIResponse(lastUserMessage.content),
                    sources: ["arxiv.org/abs/1234.5678", "research.example.com"],
                    timestamp: new Date(),
                    model: selectedModel,
                };
                setMessages((msgs) => [...msgs, aiResponse]);
            }, 1000);
        }
    };

    const copyLast = () => {
        if (messages.length === 0) return;
        const lastAI = [...messages].reverse().find((m) => m.role === "ai");
        if (lastAI) navigator.clipboard.writeText(lastAI.content);
    };

    const saveConversation = (name: string) => {
        if (messages.length === 0) return;

        const conversation: Conversation = {
            id: Date.now().toString(),
            name,
            messages: [...messages],
            model: selectedModel,
            timestamp: new Date(),
        };

        setConversations((prev) => [conversation, ...prev]);
    };

    const loadConversation = (id: string) => {
        const conversation = conversations.find((c) => c.id === id);
        if (conversation) {
            setMessages(conversation.messages);
            setSelectedModel(conversation.model);
        }
    };

    const deleteConversation = (id: string) => {
        setConversations((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <ChatContext.Provider
            value={{
                messages,
                input,
                setInput,
                sendMessage,
                suggestions,
                setSuggestions,
                clear,
                regenerate,
                copyLast,
                selectedModel,
                setSelectedModel,
                conversations,
                saveConversation,
                loadConversation,
                deleteConversation,
                isTyping,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChat must be used within a ChatProvider");
    return ctx;
};
