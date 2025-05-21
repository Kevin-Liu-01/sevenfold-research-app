import React from 'react';

interface SidebarButtonProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ icon, text, active, onClick }) => (
  <button
    className={`flex items-center gap-1 py-1 px-3 rounded transition
      ${active ? 'bg-blue-200 text-blue-900 font-semibold' : 'hover:bg-gray-300 text-gray-800'}`}
    onClick={onClick}
  >
    <span className="w-5 h-5">{icon}</span>
    <span>{text}</span>
  </button>
);

export default SidebarButton;