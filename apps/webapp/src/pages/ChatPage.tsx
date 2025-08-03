import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (inputValue.trim()) {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        isUser: true,
        timestamp: new Date()
      };

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message! I'm here to help with your research and questions. This is a placeholder response while the backend is being developed.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      setInputValue("");
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ marginLeft: '70px' }}>
      {messages.length === 0 ? (
        // Initial state - centered layout
        <div className="flex flex-col items-center justify-center h-screen px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900">ketspen</h1>
          </div>

          {/* Centered Input Bar */}
          <div className="w-full max-w-4xl">
            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
              {/* Input Field */}
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent text-gray-900 placeholder-gray-500 outline-none text-lg resize-none overflow-y-auto"
                  style={{ 
                    minHeight: '24px', 
                    maxHeight: '200px',
                    lineHeight: '1.5'
                  }}
                  rows={1}
                />
              </div>

              {/* Send Button */}
              <div className="flex items-center pt-1">
                <button 
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="text-gray-600 hover:text-gray-800 transition-colors p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons text-lg">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Chat state - professional layout
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex-shrink-0 py-6 px-8 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-900">ketspen</h1>
          </div>

          {/* Sticky User Query Header */}
          {messages.length > 0 && messages.some(m => m.isUser) && (
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {messages.filter(m => m.isUser).slice(-1)[0]?.text || "Current Question"}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages Area */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-8 py-6"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            <div className="max-w-4xl mx-auto">
              {messages.map((message, index) => {
                // Check if this is the start of a new conversation (user message after an AI message)
                const isNewConversation = message.isUser && index > 0 && !messages[index - 1].isUser;
                
                return (
                  <div key={message.id} className={`${isNewConversation ? 'mt-12 pt-8 border-t border-gray-400' : ''}`}>
                    <div className="space-y-4">
                      {message.isUser ? (
                        // User question as header
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {message.text}
                          </h2>
                          <div className="w-16 h-px bg-gray-300"></div>
                        </div>
                      ) : (
                        // AI response
                        <div className="text-gray-700 leading-relaxed">
                          <p className="text-base">{message.text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Input Bar */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                {/* Input Field */}
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="w-full bg-transparent text-gray-900 placeholder-gray-500 outline-none text-lg resize-none overflow-y-auto"
                    style={{ 
                      minHeight: '24px', 
                      maxHeight: '200px',
                      lineHeight: '1.5'
                    }}
                    rows={1}
                  />
                </div>

                {/* Send Button */}
                <div className="flex items-center pt-1">
                  <button 
                    onClick={sendMessage}
                    disabled={!inputValue.trim()}
                    className="text-gray-600 hover:text-gray-800 transition-colors p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-icons text-lg">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage; 
