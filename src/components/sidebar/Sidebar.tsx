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
import { useAuth } from "../../context/AuthContext";
import SidebarButton from "./SidebarButton";
import SourcesPanel from "./SourcesPanel";
import type { Paper } from "../../../database.types";
import DocumentsPanel from "./DocumentsPanel";

type NavItem = { icon: string; viewer: string; label: string };
const navItems: NavItem[] = [
  { icon: "search", label: "Search", viewer: "search" },
  { icon: "source", label: "Sources", viewer: "paper" },
  { icon: "3p", label: "Chat", viewer: "chat" },
  { icon: "edit", label: "Compose", viewer: "compose" },
  { icon: "settings", label: "Settings", viewer: "settings" },
];

interface SidebarProps {
  activeViewer: string;
  setActiveViewer: (view: string) => void;
  sourcePapers: Paper[];
  candidatePapers: Paper[];
  onPaperSelect: (paper: Paper) => void;
  selectedPaperId: string | null;
  onCreateDocument: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeViewer,
  setActiveViewer,
  sourcePapers,
  candidatePapers,
  onPaperSelect,
  selectedPaperId,
  onCreateDocument,
}) => {
  const { user, signOut } = useAuth();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const sidebarWidth = 70;
  const panelWidth = 280;

  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const currentTab = hoveredTab ?? "search";
  const togglePin = () => setIsPinned((p) => !p);

  const handleClickPaper = (paper: Paper) => {
    onPaperSelect(paper);
    setActiveViewer("paper");
    if (!isPinned) setIsExpanded(false);
  };

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
          `bg-app-outer border-r border-gray-100 shadow-lg z-20 transform-gpu transition-all duration-300 ease-in-out ` +
          (visible
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "-translate-x-full opacity-0 pointer-events-none")
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{currentTab}</h3>
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
        {currentTab === "Sources" ? (
          <SourcesPanel
            sourcePapers={sourcePapers}
            candidatePapers={candidatePapers}
            selectedPaperId={selectedPaperId}
            onClickPaper={handleClickPaper}
          />
        ) : currentTab === "Compose" ? (
          <DocumentsPanel
            documents={[
              { id: "doc1", title: "Research Outline" },
              { id: "doc2", title: "Meeting Notes" },
              { id: "doc3", title: "Draft Summary" },
            ]}
            selectedDocId={" your selected document ID "}
            onClickDocument={(doc) => {
              /* handler */
            }}
          />
        ) : (
          <div className="p-4 text-gray-500">
            {" "}
            {/* stub for other panels */}
            {currentTab} content…
          </div>
        )}
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
        className="fixed inset-y-0 left-0 bg-app-outer z-30 flex flex-col items-center py-4"
        style={{ width: sidebarWidth, height: "100vh" }}
      >
        {/* Logo */}
        <div className="mb-12">
          <img src="/images/logo.png" alt="Logo" className="h-12 w-12" />
        </div>

        {/* Nav buttons */}
        <nav className="flex-1 flex flex-col justify-top space-y-6">
          {navItems.map((item) => {
            const isActive = activeViewer === item.viewer;
            return (
              <SidebarButton
                key={item.viewer}
                icon={item.icon}
                label={item.label}
                active={isActive}
                onHover={() => setHoveredTab(item.label)}
                onClick={() => setActiveViewer(item.viewer)}
              />
            );
          })}
        </nav>

        {/* Avatar + popup */}
        <div ref={avatarRef} className="relative mt-6">
          <div
            onClick={() => setAvatarMenuOpen((o) => !o)}
            className="flex flex-col justify-center"
          >
            <img
              src={
                user?.user_metadata?.avatar_url ||
                "https://avatars.githubusercontent.com/u/66856750?v=4"
              }
              alt="Avatar"
              className="h-8 w-8 mx-auto rounded-full border border-gray-200 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
            />
            <span className="cursor-pointer text-[0.7rem] mt-0.5 transition-all duration-200">
              Account
            </span>
          </div>

          <div
            className={`absolute text-xs left-[calc(100%-0.5rem)] transform-gpu transition-all duration-200 ease-out ${
              avatarMenuOpen
                ? "translate-x-2 -translate-y-[100%] opacity-100 pointer-events-auto"
                : "translate-x-0 -translate-y-[100%] opacity-0 pointer-events-none"
            } ml-2 w-max bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-40`}
          >
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-50"
              onClick={() => setAvatarMenuOpen(false)}
            >
              Account
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-50"
              onClick={() => setAvatarMenuOpen(false)}
            >
              Settings
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
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
      {hoveredTab != "Settings" && hoveredTab != "Search" && renderPanel()}
    </div>
  );
};

export default Sidebar;
