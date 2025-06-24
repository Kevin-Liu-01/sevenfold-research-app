// src/components/TestViewer.tsx
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/testWorkbench/Sidebar";
import SearchWindow from "../components/testWorkbench/SearchWindow";
import PDFViewer from "../components/testWorkbench/PDFViewer";
import ChatbotWindow from "../components/testWorkbench/ChatbotWindow";

import { Rnd, type RndDragCallback, type RndResizeCallback } from "react-rnd";

interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
}

const defaultSidebar = 80;
const padding = 20;
const dragGrid = [20, 20] as [number, number];
const resizeGrid = [20, 20] as [number, number];

const TestViewer: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [layouts, setLayouts] = useState<Record<string, Layout>>(() => {
    const saved = localStorage.getItem("testviewer_layout");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // fallback defaults
    return computeDefaults(true);
  });

  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // compute layout defaults
  const computeDefaults = useCallback(
    (overrideCollapsed?: boolean): Record<string, Layout> => {
      const isCollapsed =
        overrideCollapsed !== undefined ? overrideCollapsed : collapsed;
      const sidebarWidth = isCollapsed ? 0 : defaultSidebar;
      const mainWidth = size.width - sidebarWidth - padding * 2;
      const mainHeight = size.height - padding * 2;
      const leftWidth = mainWidth * 0.8 - padding / 2;
      const rightWidth = mainWidth * 0.2 - padding / 2;
      const searchHeight = mainHeight * 0.6;
      const pdfHeight = mainHeight - searchHeight - padding;

      return {
        search: {
          x: padding,
          y: padding,
          width: leftWidth,
          height: searchHeight,
        },
        pdf: {
          x: padding,
          y: padding + searchHeight + padding,
          width: leftWidth,
          height: pdfHeight,
        },
        chatbot: {
          x: padding + leftWidth + padding / 2,
          y: padding,
          width: rightWidth,
          height: mainHeight,
        },
      };
    },
    [size]
  );

  // persist layouts
  useEffect(() => {
    localStorage.setItem("testviewer_layout", JSON.stringify(layouts));
  }, [layouts]);

  // resize listener
  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // recompute panel sizes on collapse/resize
  useEffect(() => {
    setLayouts((prev) => {
      const defs = computeDefaults();
      return {
        search: { ...defs.search, ...prev.search },
        pdf: { ...defs.pdf, ...prev.pdf },
        chatbot: { ...defs.chatbot, ...prev.chatbot },
      };
    });
  }, [computeDefaults, collapsed]);

  const onDragStop: RndDragCallback = (_, d, id) => {
    setLayouts((p) => ({
      ...p,
      [id as string]: { ...p[id as string], x: d.x, y: d.y },
    }));
    setActiveId(id as string);
  };
  const onResizeStop: RndResizeCallback = (_, __, ref, ___, pos, id) => {
    setLayouts((p) => ({
      ...p,
      [id as string]: {
        x: pos.x,
        y: pos.y,
        width: parseInt(ref.style.width, 10),
        height: parseInt(ref.style.height, 10),
      },
    }));
    setActiveId(id as string);
  };

  const panels = [
    { id: "search", Component: SearchWindow },
    { id: "pdf", Component: PDFViewer },
    { id: "chatbot", Component: ChatbotWindow },
  ];

  return (
    <div className="h-screen w-screen bg-gray-100 relative overflow-hidden">
      {/* Hover zone to open */}
      {/* {collapsed && (
        <div
          className="absolute top-0 left-0 h-full w-2 cursor-pointer z-40 bg-gray-200 hover:bg-gray-300"
          onMouseEnter={() => setCollapsed(false)}
        />
      )} */}

      <div className="flex h-full">
        {/* Sidebar wrapper */}

        <Sidebar />
        {/* Panels */}
        <div className="relative flex-1 z-20 p-6 space-y-6 bg-gray-100 overflow-auto">
          {panels.map(({ id, Component }) => {
            const d = layouts[id];
            const isActive = activeId === id;
            const shadowColor =
              id === "search"
                ? "rgba(253,216,53,0.4)" // yellow
                : id === "pdf"
                ? "rgba(139,195,74,0.4)" // green
                : "rgba(255,152,0,0.4)"; // orange
            return (
              <Rnd
                key={id}
                size={{ width: d.width, height: d.height }}
                position={{ x: d.x, y: d.y }}
                bounds="parent"
                dragHandleClassName="drag-handle"
                enableResizing
                dragGrid={dragGrid}
                resizeGrid={resizeGrid}
                onMouseDown={() => setActiveId(id)}
                onDragStart={() => setActiveId(id)}
                onDragStop={(e, d) => {
                  onDragStop(e, d, id);
                  setActiveId(id);
                }}
                onResizeStart={() => setActiveId(id)}
                onResizeStop={(e, dir, ref, delta, pos) => {
                  onResizeStop(e, dir, ref, delta, pos, id);
                  setActiveId(id);
                }}
                style={{
                  zIndex: isActive ? 1000 : 1,
                  borderRadius: "1rem",
                  boxShadow: isActive
                    ? `2px 1px px 2px ${shadowColor}`
                    : `0 1px 1px ${shadowColor}`,
                  background: "#ffffff",
                  transition: "box-shadow 0.2s",
                }}
              >
                <div className="relative h-full w-full drag-handle border border-gray-200 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="h-8 bg-gray-50 flex items-center px-3 border-b border-gray-200">
                    <i className="material-icons-outlined text-gray-500 cursor-move">
                      drag_indicator
                    </i>
                    <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                      {id}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="w-auto h-[calc(100%-4rem)] m-4 rounded-md border overflow-auto">
                    <Component />
                  </div>
                </div>
              </Rnd>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestViewer;
