import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

// Navigation buttons and their corresponding panels
const navItems = [
  { icon: "search", label: "Search" },
  { icon: "remove_red_eye", label: "Skims" },
  { icon: "source", label: "Sources" },
  { icon: "edit", label: "Write" },
];

// Hard-coded panel data for demonstration purposes
const panelData: Record<string, string[]> = {
  Search: [
    "Recent query: React hooks",
    "Saved search: API design",
    "Advanced tips",
  ],
  Skims: [
    "Skim #1: Tailwind in 5min",
    "Skim #2: React perf",
    "Skim #3: Testing",
  ],
  Sources: [
    "https://example.com/article-1",
    "https://another.com/report-2025",
    "https://news.site/insight",
    "https://docs.org/reference",
  ],
  Write: ["New Doc", "Blog Post", "Notes", "Report Template"],
};

const Sidebar: React.FC = () => {
  const sidebarWidth = 70;
  const panelWidth = 300;
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("Search");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close avatar menu when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Toggle pin state
  const togglePin = () => setIsPinned((p) => !p);

  // Handle click outside to collapse panel
  const renderPanel = () => {
    const visible = isExpanded || isPinned;

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
        <div className="flex-1 overflow-auto bg-gray-50 p-3 space-y-2">
          {panelData[activeTab].map((item) => (
            <div
              key={item}
              className="text-xs rounded-md px-2 py-1 hover:border-gray-300 border border-gray-200 transition"
            >
              {activeTab === "Sources" ? (
                <a
                  href={item}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words text-blue-600 hover:underline"
                >
                  {item}
                </a>
              ) : (
                <span>{item}</span>
              )}
            </div>
          ))}
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
