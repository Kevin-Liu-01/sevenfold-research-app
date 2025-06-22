// src/components/testWorkbench/ChatbotWindow.tsx
import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
} from "react";
import { ResearchContext } from "../../context/ResearchContext";

interface Message {
  sender: "ai" | "user";
  text: string;
}
const suggestions = [
  "Summarize",
  "Outline",
  "Generate Keywords",
  "Find References",
];

const ChatbotWindow: React.FC = () => {
  const { pdfUrl } = useContext(ResearchContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // initial welcome
  useEffect(() => {
    setMessages([
      {
        sender: "ai",
        text: "Welcome! I can help you find, summarize, and analyze research papers.",
      },
    ]);
  }, []);

  // on PDF load
  useEffect(() => {
    if (pdfUrl) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: `🔖 Here's a brief on ${pdfUrl}` },
      ]);
    }
  }, [pdfUrl]);

  const sendMessage = (text: string) => {
    if (!text.trim() || !pdfUrl) return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `🔖 Here's a brief on “${text}”: Lorem ipsum...`,
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-white rounded shadow-sm text-xs leading-tight">
      <div className="px-3 py-2 border-b">
        <h3 className="text-sm font-medium">AI Assistant</h3>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.sender === "ai" && (
              <img
                src="/images/logo-bw.png"
                alt="ai assistant"
                className="w-6 h-6 object-cover rounded-full mr-1"
              />
            )}
            <div
              className={`max-w-[75%] overflow-hidden text-wrap p-2 rounded-md ${
                m.sender === "user"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.text}
            </div>
            {m.sender === "user" && (
              <div className="w-6 h-6 bg-blue-500 rounded-full ml-1 flex items-center justify-center text-white text-[10px]">
                <img
                  src="https://avatars.githubusercontent.com/u/66856750?v=4"
                  alt="avatar"
                  className="h-full w-full rounded-full"
                />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-1">
            <img
              src="/images/logo-bw.png"
              alt="ai assistant"
              className="w-6 h-6 object-cover rounded-full mr-1"
            />
            <div className="flex ml-1 space-x-1">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-400"></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-3 py-2 border-t space-y-2">
        <div className="flex space-x-1 overflow-x-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="px-2 py-1 border bg-gray-100 rounded-full whitespace-nowrap text-[10px] hover:bg-gray-200"
            >
              {s}
            </button>
          ))}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border rounded p-1 h-16 resize-none focus:ring-2 focus:ring-blue-300 text-xs"
          placeholder="Type a message…"
        />
        <button
          onClick={() => sendMessage(input)}
          className="mt-1 w-full bg-black text-white py-1 rounded text-xs hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatbotWindow;
