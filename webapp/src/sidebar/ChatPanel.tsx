import React, { useRef, useEffect, useState } from "react";
import { useChat } from "../../context/ChatContext";

interface ChatPanelProps {
  compact?: boolean;
}

function ChatPanel({ compact = false }: ChatPanelProps) {
  const { 
    messages, 
    input, 
    setInput, 
    sendMessage, 
    suggestions, 
    clear, 
    regenerate, 
    copyLast,
    selectedModel,
    setSelectedModel,
    conversations,
    saveConversation,
    loadConversation,
    deleteConversation,
    isTyping
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [conversationName, setConversationName] = useState("New Conversation");
  const [showConversations, setShowConversations] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
    setTimeout(() => {
      sendMessage(s);
    }, 100);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveConversation = () => {
    saveConversation(conversationName);
    alert("Conversation saved!");
  };

  const exportConversation = () => {
    const conversationText = messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversationName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const models = [
    { id: "gpt-4", name: "GPT-4", description: "Most capable model" },
    { id: "gpt-3.5", name: "GPT-3.5", description: "Fast and efficient" },
    { id: "claude-3", name: "Claude 3", description: "Anthropic's latest" },
    { id: "gemini", name: "Gemini", description: "Google's AI model" }
  ];

  // Compact version for sidebar
  if (compact) {
    return (
      <div className="flex flex-col h-full w-full bg-white overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="material-icons text-white text-xs">smart_toy</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">AI Chat</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowConversations(!showConversations)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
              title="Conversation history"
            >
              <span className="material-icons-outlined text-sm">history</span>
            </button>
            <button 
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors" 
              title="Clear conversation" 
              onClick={clear}
            >
              <span className="material-icons-outlined text-sm">delete_outline</span>
            </button>
          </div>
        </div>

        {/* Conversation History Sidebar for Compact */}
        {showConversations && (
          <div className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 shadow-lg">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">History</h3>
                <button
                  onClick={() => setShowConversations(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons-outlined text-sm">close</span>
                </button>
              </div>
              <button
                onClick={() => {
                  clear();
                  setShowConversations(false);
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 justify-center"
              >
                <span className="material-icons-outlined text-xs">add</span>
                New Chat
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-80px)]">
              {conversations.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-xs">
                  <span className="material-icons-outlined text-2xl mb-1">chat</span>
                  <p>No saved conversations</p>
                </div>
              ) : (
                <div className="p-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors mb-1"
                      onClick={() => {
                        loadConversation(conversation.id);
                        setShowConversations(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-xs truncate">
                            {conversation.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {conversation.messages.length} messages
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <span className="material-icons-outlined text-xs">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact Conversation */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                <span className="material-icons text-white text-lg">smart_toy</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How can I help?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Ask me anything!
              </p>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl shadow-sm text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white text-gray-900 rounded-bl-md border border-gray-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Sources:</div>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.map((s, j) => (
                            <a
                              key={j}
                              href={`https://${s}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-100 transition-colors"
                            >
                              <span className="material-icons-outlined text-xs">link</span>
                              {s}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 rounded-xl rounded-bl-md border border-gray-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Compact Input */}
        <div className="border-t border-gray-100 bg-white p-3">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                className="w-full px-3 py-2 pr-8 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Type your message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                style={{ minHeight: '36px', maxHeight: '80px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-icons-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Full version for main chat page
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Conversation history"
          >
            <span className="material-icons-outlined text-lg">menu</span>
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="material-icons text-white text-sm">smart_toy</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-lg">AI Assistant</span>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">• {models.find(m => m.id === selectedModel)?.description}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" 
            title="Save conversation" 
            onClick={handleSaveConversation}
          >
            <span className="material-icons-outlined text-lg">save</span>
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" 
            title="Export conversation" 
            onClick={exportConversation}
          >
            <span className="material-icons-outlined text-lg">download</span>
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" 
            title="Settings" 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <span className="material-icons-outlined text-lg">settings</span>
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" 
            title="Regenerate response" 
            onClick={regenerate}
          >
            <span className="material-icons-outlined text-lg">refresh</span>
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" 
            title="Clear conversation" 
            onClick={clear}
          >
            <span className="material-icons-outlined text-lg">delete_outline</span>
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" 
            title="Copy last response" 
            onClick={copyLast}
          >
            <span className="material-icons-outlined text-lg">content_copy</span>
          </button>
        </div>
      </div>

      {/* Conversation History Sidebar */}
      {showConversations && (
        <div className="absolute left-0 top-0 h-full w-80 bg-white border-r border-gray-200 z-50 shadow-lg">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Conversations</h3>
              <button
                onClick={() => setShowConversations(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <button
              onClick={() => {
                clear();
                setShowConversations(false);
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
            >
              <span className="material-icons-outlined text-sm">add</span>
              New Chat
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-80px)]">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <span className="material-icons-outlined text-4xl mb-2">chat</span>
                <p>No saved conversations yet</p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-2"
                    onClick={() => {
                      loadConversation(conversation.id);
                      setShowConversations(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {conversation.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.messages.length} messages • {conversation.model}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {conversation.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <span className="material-icons-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conversation Name</label>
              <input
                type="text"
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter conversation name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <span className="material-icons text-white text-2xl">smart_toy</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              How can I help you today?
            </h3>
            <p className="text-gray-600 mb-8 max-w-md">
              Ask me anything! I can help with research, writing, analysis, and much more.
            </p>
            
            {/* Quick suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {[
                "Help me write a research paper",
                "Explain quantum computing",
                "Analyze this data for trends",
                "Create a project outline",
                "Summarize recent AI developments",
                "Help with academic writing",
                "Generate creative ideas",
                "Review and improve my code"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestion(suggestion)}
                  className="p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-icons-outlined text-gray-400 group-hover:text-blue-500 transition-colors">
                      {index % 2 === 0 ? "edit" : "lightbulb"}
                    </span>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {suggestion}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-gray-900 rounded-bl-md border border-gray-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-2">Sources:</div>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((s, j) => (
                          <a
                            key={j}
                            href={`https://${s}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <span className="material-icons-outlined text-xs">link</span>
                            {s}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex gap-2 px-6 py-3 border-t border-gray-100 bg-white overflow-x-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="px-4 py-2 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors whitespace-nowrap"
              onClick={() => handleSuggestion(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 bg-white">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="material-icons-outlined text-blue-600 text-sm">attach_file</span>
                <span className="text-sm text-blue-700">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <span className="material-icons-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 bg-white p-4">
        <form onSubmit={handleSend} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="w-full px-4 py-3 pr-24 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Attach file"
              >
                <span className="material-icons-outlined text-lg">attach_file</span>
              </button>
              <button
                type="button"
                onClick={focusInput}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Keyboard shortcuts"
              >
                <span className="material-icons-outlined text-lg">keyboard</span>
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <span className="material-icons-outlined text-lg">send</span>
            Send
          </button>
        </form>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt,.pdf,.doc,.docx,.csv,.json"
        />
        
        {/* Input footer */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{input.length}/4000</span>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel; 
