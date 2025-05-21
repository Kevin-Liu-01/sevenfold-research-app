import React, { useState, useRef, useEffect } from 'react';
import { HomeIcon, Cog6ToothIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import SidebarButton from './SidebarButton';
import type { Paper } from '../../../database.types';

interface SidebarProps {
  activeViewer: string;
  setActiveViewer: (viewer: string) => void;
  sourcePapers: Paper[];
  candidatePapers: Paper[];
  onPaperSelect: (paper: Paper) => void;
  selectedPaperId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeViewer,
  setActiveViewer,
  sourcePapers,
  candidatePapers,
  onPaperSelect,
  selectedPaperId
}) => {
  const navigate = useNavigate();
  const [width, setWidth] = useState(250); // Default width in pixels
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) { // Min and max width constraints
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handlePaperClick = (paper: Paper) => {
    setActiveViewer('paper');
    onPaperSelect(paper);
  };

  return (
    <aside
      ref={sidebarRef}
      className="bg-gray-100 h-full flex flex-col p-2 gap-8 relative"
      style={{ width: `${width}px` }}
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500"
        onMouseDown={() => {
          isResizing.current = true;
        }}
      />

      <section className="flex flex-col gap-2">
        <SidebarButton
          icon={<HomeIcon />}
          text="Return Home"
          active={activeViewer === 'home'}
          onClick={() => navigate('/home')}
        />
        <SidebarButton
          icon={<Cog6ToothIcon />}
          text="Settings"
          active={activeViewer === 'settings'}
          onClick={() => setActiveViewer('settings')}
        />
        <SidebarButton
          icon={<ArrowUpTrayIcon />}
          text="Upload"
          active={activeViewer === 'upload'}
          onClick={() => setActiveViewer('upload')}
        />
        <SidebarButton
          icon={<MagnifyingGlassIcon />}
          text="Search"
          active={activeViewer === 'search'}
          onClick={() => setActiveViewer('search')}
        />
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Source Papers</h3>
        <ul className="space-y-1 text-sm">
          {sourcePapers.length
            ? sourcePapers.map(p => (
              <SidebarButton
                key={p.id}
                icon={<DocumentTextIcon />}
                text={p.filename}
                active={selectedPaperId === p.id}
                onClick={() => handlePaperClick(p)}
              />
            ))
            : <li className="text-gray-400">None yet</li>}
        </ul>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Candidate Papers</h3>
        <ul className="space-y-1 text-sm">
          {candidatePapers.length
            ? candidatePapers.map(p => (
              <SidebarButton
                key={p.id}
                icon={<DocumentTextIcon />}
                text={p.filename}
                active={selectedPaperId === p.id}
                onClick={() => handlePaperClick(p)}
              />
            ))
            : <li className="text-gray-400">None yet</li>}
        </ul>
      </section>
    </aside>
  );
};

export default Sidebar;
