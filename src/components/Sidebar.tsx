// Sidebar component
//
// To use the sidebar, simply import it and include it in your component tree.
// For example, in your main App component or a specific page:
// import Sidebar from "./components/workbench/Sidebar";
//
// function App() {
//   return (//     <div className="flex">
//       <Sidebar />
//       <div className="flex-1 p-4">
//         {/* Your main content goes here */}
//       </div>
//     </div>
//   );
// }

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// Navigation buttons and their corresponding panels
const navItems = [
  { icon: "search", label: "Search" },
  { icon: "source", label: "Sources" },
  { icon: "3p", label: "Chat" },
  { icon: "edit", label: "Compose" },
];

// Now using objects with title + url for Sources
interface Source {
  title: string;
  url: string;
}

const panelData: Record<string, string[] | Source[]> = {
  Search: [
    "Recent query: React hooks",
    "Saved search: API design",
    "Advanced tips",
  ],
  Chat: [
    "Chat #1: Water research",
    "Chat #2: Air research",
    "Chat #3: Fire research",
  ],
  Sources: [
    {
      title: "Attention Is All You Need",
      url: "https://arxiv.org/pdf/1706.03762.pdf",
    },
    {
      title: "U-Net: Convolutional Networks for Biomedical Segmentation",
      url: "https://arxiv.org/pdf/1409.1556.pdf",
    },
    {
      title: "Deep Residual Learning for Image Recognition (ResNet)",
      url: "https://arxiv.org/pdf/1512.03385.pdf",
    },
    {
      title: "BERT: Pre-training of Deep Bidirectional Transformers",
      url: "https://arxiv.org/pdf/2002.05709.pdf",
    },
  ],
  Compose: ["New Doc", "Blog Post", "Notes", "Report Template"],
};

const Sidebar: React.FC = () => {
  const sidebarWidth = 70;
  const panelWidth = 300;
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("Search");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // PDF hover-preview state
  const [hoveredPdf, setHoveredPdf] = useState<string | null>(null);
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close avatar menu on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const togglePin = () => setIsPinned((p) => !p);

  const renderPanel = () => {
    const visible = isExpanded || isPinned;
    const items = panelData[activeTab];

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: sidebarWidth,
          height: "100vh",
          width: panelWidth,
        }}
        className={
          `bg-white border-r border-gray-100 shadow-lg z-20 transform-gpu transition-all duration-300 ease-in-out ` +
          (visible
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "-translate-x-full opacity-0 pointer-events-none")
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{activeTab}</h3>
          <button
            onClick={togglePin}
            className="p-1 rounded-lg hover:bg-gray-50 transition-colors duration-150 focus:outline-none"
            title={isPinned ? "Unpin panel" : "Pin panel"}
          >
            <span
              className={`text-gray-500 hover:text-gray-700 transition-colors duration-150 ${
                isPinned ? "material-icons" : "material-icons-outlined"
              }`}
            >
              push_pin
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-auto p-3 space-y-2">
          {Array.isArray(items) &&
            items.map((item) => {
              if (activeTab === "Sources") {
                const src = item as Source;
                return (
                  <div
                    key={src.url}
                    className="text-xs cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 border border-gray-100 hover:border-gray-200 transition-all duration-150"
                  >
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words text-blue-600 hover:underline"
                      onMouseEnter={(e) => {
                        setHoveredPdf(src.url);
                        setPreviewPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setPreviewPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredPdf(null)}
                    >
                      {src.title}
                    </a>
                  </div>
                );
              } else {
                return (
                  <div
                    key={item as string}
                    className="text-xs cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 border border-gray-100 hover:border-gray-200 transition-all duration-150"
                  >
                    <span className="text-gray-700">{item as string}</span>
                  </div>
                );
              }
            })}

          {/* PDF Preview Tooltip */}
          {hoveredPdf && (
            <div
              style={{
                position: "fixed",
                top: previewPos.y + 12,
                left: previewPos.x + 12,
                width: 200,
                height: 250,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.2)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                zIndex: 40,
              }}
            >
              <iframe
                src={hoveredPdf}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="PDF preview"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        if (!isPinned) setIsExpanded(false);
      }}
    >
      {/* Sidebar */}
      <div
        className="fixed inset-y-0 border-r border-gray-100 left-0 bg-white z-30 flex flex-col items-center py-6 shadow-sm"
        style={{ width: sidebarWidth, height: "100vh" }}
      >
        {/* Logo */}
        <div className="mb-6">
          <img src="/images/logo.png" alt="Logo" className="h-8 w-8" />
        </div>

        {/* Nav buttons */}
        <nav className="flex-1 flex flex-col justify-center space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.label;
            return (
              <div key={item.label} className="flex justify-center">
                <button
                  onMouseEnter={() => setActiveTab(item.label)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 focus:outline-none group ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                  style={{ width: '48px', height: '48px' }}
                >
                  <span 
                    className={`material-icons-outlined transition-all duration-200 ${
                      isActive 
                        ? 'text-lg transform scale-110' 
                        : 'text-base group-hover:scale-105'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span 
                    className={`text-xs mt-0.5 transition-all duration-200 ${
                      isActive 
                        ? 'font-medium' 
                        : 'font-normal'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>

        {/* Avatar + popup */}
        <div ref={avatarRef} className="relative mt-6">
          <div className="flex justify-center">
            <img
              src={
                user?.user_metadata?.avatar_url ||
                "https://avatars.githubusercontent.com/u/66856750?v=4"
              }
              alt="Avatar"
              className="h-8 w-8 rounded-full border border-gray-200 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
              onClick={() => setAvatarMenuOpen((o) => !o)}
            />
          </div>

          <div
            className={`absolute text-xs left-[calc(100%-0.5rem)] transform-gpu transition-all duration-200 ease-out ${
              avatarMenuOpen
                ? "translate-x-2 -translate-y-[100%] opacity-100 pointer-events-auto"
                : "translate-x-0 -translate-y-[100%] opacity-0 pointer-events-none"
            } ml-2 w-max bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-40`}
          >
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setAvatarMenuOpen(false)}
            >
              Account
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setAvatarMenuOpen(false)}
            >
              Settings
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors duration-150"
              onClick={() => {
                setAvatarMenuOpen(false);
                signOut();
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Panel */}
      {renderPanel()}
    </div>
  );
};

export default Sidebar;
