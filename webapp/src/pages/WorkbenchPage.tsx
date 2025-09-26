import React from "react";
import { useParams, Navigate } from "react-router-dom";

import { useWorkbench, ViewType, WorkbenchProvider } from "../context/WorkbenchContext";

import Sidebar from "../sidebar/Sidebar";

import ChatPanel from "../sidebar/ChatPanel";
import SourcesPanel from "../sidebar/SourcesPanel";
import ComposePanel from "../sidebar/ComposePanel";

import SearchViewer from "../viewers/SearchViewer";
import ChatViewer from "../viewers/ChatViewer";
import SourceViewer from "../viewers/SourcesViewer";
import ComposeViewer from "../viewers/ComposeViewer";
import SettingsViewer from "../viewers/SettingsViewer";

const SidepanelMap: Partial<Record<ViewType, React.FC>> = {
    [ViewType.Chat]: () => <ChatPanel />,
    [ViewType.Sources]: () => <SourcesPanel />,
    [ViewType.Compose]: () => <ComposePanel />,
};

const Sidepanel: React.FC = () => {
    const { hoveredView, setHoveredView } = useWorkbench();
    const SidepanelComponent = hoveredView ? SidepanelMap[hoveredView] : null;
    const showSidepanel = Boolean(SidepanelComponent);

    return (
        <div
            className={`
                fixed top-0 left-0 z-1 w-64 ml-20 p-4
                h-screen shadow-lg bg-app-outer
                transform transition-transform duration-350 ease-in-out
                ${showSidepanel ? "translate-x-0" : "-translate-x-full"}
            `}
            onMouseEnter={() => {
                if (showSidepanel) setHoveredView(hoveredView);
            }}
            onMouseLeave={() => {
                setHoveredView(null);
            }}
        >
            {SidepanelComponent && <SidepanelComponent />}
        </div>
    );
};

const ViewerMap: Record<ViewType, React.FC> = {
    [ViewType.Search]: SearchViewer,
    [ViewType.Chat]: ChatViewer,
    [ViewType.Sources]: SourceViewer,
    [ViewType.Compose]: ComposeViewer,
    [ViewType.Settings]: SettingsViewer,
};

const Viewer: React.FC = () => {
    const { currentView } = useWorkbench();
    const ViewerComponent = ViewerMap[currentView] || SearchViewer;

    return (
        <section className="z-0 flex-1 my-2 mr-2 border overflow-hidden border-gray-200 rounded-lg bg-app-inner">
            <ViewerComponent />
        </section>
    );
};

export default function WorkbenchPage() {
    const { projectId } = useParams();
    if (!projectId) return <Navigate to="/" replace />;

    return (
        <WorkbenchProvider projectId={projectId}>
            <main className="flex h-screen bg-app-outer">
                <Sidebar />
                <Sidepanel />
                <Viewer />
            </main>
        </WorkbenchProvider>
    );
}
