import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

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
          `bg-white border-r border-gray-200 shadow-xl z-20 transform-gpu transition-all duration-300 ease-in-out ` +
          (visible
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "-translate-x-full opacity-0 pointer-events-none")
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
          <h3 className="text-sm font-medium">{activeTab}</h3>
          <button
            onClick={togglePin}
            className="px-1 pt-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
            title={isPinned ? "Unpin panel" : "Pin panel"}
          >
            <span
              className={` ${
                isPinned ? "material-icons" : "material-icons-outlined"
              }`}
            >
              push_pin
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-auto m-2 rounded-lg border border-gray-200 bg-gray-50 p-2 space-y-2">
          {Array.isArray(items) &&
            items.map((item) => {
              if (activeTab === "Sources") {
                const src = item as Source;
                return (
                  <div
                    key={src.url}
                    className="text-xs cursor-pointer bg-white rounded-md px-2 py-1 hover:border-gray-300 border border-gray-200 transition"
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
                    className="text-xs cursor-pointer bg-white rounded-md px-2 py-1 hover:border-gray-300 border border-gray-200 transition"
                  >
                    <span>{item as string}</span>
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
        className="fixed inset-y-0 border-r border-gray-200 left-0 bg-white z-30 flex flex-col items-center py-4 space-y-6"
        style={{ width: sidebarWidth, height: "100vh" }}
      >
        {/* Logo */}
        <img src="/images/logo.png" alt="Logo" className="h-10 w-10" />

        {/* Nav buttons */}
        <nav className="flex-1 flex flex-col justify-center space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onMouseEnter={() => setActiveTab(item.label)}
              className="flex flex-col items-center text-gray-600 p-1 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
            >
              <span className="material-icons-outlined text-xl">
                {item.icon}
              </span>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Avatar + popup */}
        <div ref={avatarRef} className="relative">
          <img
            src={
              user?.avatarUrl ||
              "https://avatars.githubusercontent.com/u/66856750?v=4"
            }
            alt="Avatar"
            className="h-10 w-10 rounded-full border-2 border-gray-200 cursor-pointer"
            onClick={() => setAvatarMenuOpen((o) => !o)}
          />

          <div
            className={`absolute text-xs left-[calc(100%-0.5rem)] transform-gpu transition-all duration-200 ease-out ${
              avatarMenuOpen
                ? "translate-x-2 -translate-y-[100%] opacity-100 pointer-events-auto"
                : "translate-x-0 -translate-y-[100%] opacity-0 pointer-events-none"
            } ml-2 w-max bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-40`}
          >
            <button
              className="block w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => setAvatarMenuOpen(false)}
            >
              Account
            </button>
            <button
              className="block w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => setAvatarMenuOpen(false)}
            >
              Settings
            </button>
            <button
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
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
