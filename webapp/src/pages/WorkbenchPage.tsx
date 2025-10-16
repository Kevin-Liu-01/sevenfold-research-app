import React from "react";
import { useParams, Navigate } from "react-router-dom";

import { ViewType, WorkbenchProvider } from "../context/WorkbenchContext";

import Sidebar from "../sidebar/Sidebar";

import SearchViewer from "../viewers/SearchViewer";
import ChatViewer from "../viewers/ChatViewer";
import LibraryViewer from "../viewers/LibraryViewer";
import ComposeViewer from "../viewers/ComposeViewer";
import SettingsViewer from "../viewers/SettingsViewer";

const ViewerMap: Record<ViewType, React.FC> = {
    [ViewType.Search]: SearchViewer,
    [ViewType.Chat]: ChatViewer,
    [ViewType.Library]: LibraryViewer,
    [ViewType.Compose]: ComposeViewer,
    [ViewType.Settings]: SettingsViewer,
};

export default function WorkbenchPage() {
    const { projectId, view } = useParams<{ projectId?: string; view?: string }>();

    if (!projectId) return <Navigate to="/" replace />;

    const normalizedView = Object.values(ViewType).includes((view ?? "") as ViewType)
        ? ((view as ViewType) ?? ViewType.Search)
        : null;

    if (!normalizedView) {
        return <Navigate to={`/project/${projectId}/search`} replace />;
    }

    const ViewerComponent = ViewerMap[normalizedView] || SearchViewer;

    return (
        <WorkbenchProvider projectId={projectId}>
            <main className="flex h-screen bg-app-outer">
                <Sidebar />
                <section className="z-0 flex-1 my-2 mr-2 border overflow-hidden border-gray-200 rounded-lg bg-app-inner">
                    <ViewerComponent />
                </section>
            </main>
        </WorkbenchProvider>
    );
}
