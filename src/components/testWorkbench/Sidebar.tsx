// src/components/testWorkbench/Sidebar.tsx
import React from "react";

const navItems = [
  { icon: "search", label: "Search" },
  { icon: "remove_red_eye", label: "Skims" },
  { icon: "source", label: "Sources" },
  { icon: "edit", label: "Write" },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapseToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapseToggle }) => {
  return (
    <div className="relative h-full w-full">
      {/* Sliding panel */}
      <div
        className={`absolute inset-0 bg-white shadow-lg p-4 flex flex-col items-center space-y-6
                    transform transition-transform duration-300
                    ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
      >
        {/* Only show this when expanded */}
        <button
          onClick={onCollapseToggle}
          className="absolute flex items-center justify-center bottom-[calc(50%-2rem)] right-[-1.76rem] z-[90] py-2 pr-1 bg-white border-r border-y border-gray-300 rounded-r-full hover:bg-gray-100 transition"
        >
          <i className="material-icons-outlined text-gray-600">
            {collapsed ? "chevron_right" : "chevron_left"}
          </i>
        </button>

        <img
          src="/images/logo.png"
          alt="avatar"
          className="h-12 w-12 rounded-full"
        />

        {/* Navigation icons */}
        <nav className="flex flex-col my-auto items-center space-y-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              className="flex flex-col text-center items-center text-gray-700 hover:text-blue-600"
            >
              <i className="material-icons-outlined text-2xl">{item.icon}</i>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Top circles (branding) */}
        <div className="space-y-2">
          <div className="h-4 w-4 bg-green-500 rounded-full"></div>
          <div className="h-4 w-4 bg-yellow-300 rounded-full"></div>
          <div className="h-4 w-4 bg-orange-500 rounded-full"></div>
          <div className="h-4 w-4 bg-black rounded-full"></div>
        </div>

        {/* Avatar */}
        <img
          src="https://avatars.githubusercontent.com/u/66856750?v=4"
          alt="avatar"
          className="h-12 w-12 rounded-full"
        />
      </div>
    </div>
  );
};

export default Sidebar;
