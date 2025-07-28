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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white" style={{ marginLeft: '70px' }}>
      {messages.length === 0 ? (
        // Initial state - centered layout
        <div className="flex flex-col items-center justify-center h-screen px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">ketspen</h1>
          </div>

          {/* Centered Input Bar */}
          <div className="w-full max-w-4xl">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3 shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow duration-300">
              {/* Left Icons */}
              <div className="flex items-center gap-3 pt-1">
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">search</span>
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">apps</span>
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">lightbulb</span>
                </button>
              </div>

              {/* Input Field */}
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything or @mention a Space"
                  className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-lg resize-none overflow-y-auto"
                  style={{ 
                    minHeight: '24px', 
                    maxHeight: '200px',
                    lineHeight: '1.5'
                  }}
                  rows={1}
                />
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-3 pt-1">
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">language</span>
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">attach_file</span>
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">mic</span>
                </button>
                <button 
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="text-blue-600 hover:text-blue-700 transition-colors p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons text-lg">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Chat state - bottom input layout
        <div className="flex flex-col h-screen px-8 py-6">
          {/* Header */}
          <div className="flex-shrink-0 mb-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">ketspen</h1>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-6 mb-6"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            {messages.map((message, index) => (
              <div key={message.id} className="flex flex-col items-center space-y-2">
                {/* Message Bubble */}
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 shadow-sm ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-2 ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium">
                    Share
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium">
                    Export
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium">
                    Rewrite
                  </button>
                  <div className="flex items-center gap-2 ml-4">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      <span className="material-icons text-sm">code</span>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      <span className="material-icons text-sm">thumb_up</span>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      <span className="material-icons text-sm">thumb_down</span>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      <span className="material-icons text-sm">more_vert</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3 shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow duration-300">
              {/* Left Icons */}
              <div className="flex items-center gap-3 pt-1">
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">search</span>
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">apps</span>
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">lightbulb</span>
                </button>
              </div>

              {/* Input Field */}
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything or @mention a Space"
                  className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-lg resize-none overflow-y-auto"
                  style={{ 
                    minHeight: '24px', 
                    maxHeight: '200px',
                    lineHeight: '1.5'
                  }}
                  rows={1}
                />
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-3 pt-1">
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">language</span>
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">attach_file</span>
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                  <span className="material-icons text-lg">mic</span>
                </button>
                <button 
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="text-blue-600 hover:text-blue-700 transition-colors p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons text-lg">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage; 
