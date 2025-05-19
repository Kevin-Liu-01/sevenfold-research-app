// src/pages/ProjectPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TABS = [
  { key: "home", label: "Home" },
  { key: "search", label: "Search" },
  { key: "settings", label: "Settings" },
  { key: "active", label: "Active Papers" },
  { key: "semi", label: "Semi-useful Papers" },
  { key: "manuscript", label: "Manuscript" },
];

const ProjectPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useUI();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const proj = await fetchProjectById(id!);
      setProject(proj);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line
  }, [id]);

  // Simple tab rendering logic
  function renderViewer() {
    if (activeTab === "home") {
      navigate("/home");
      return null;
    }
    if (activeTab === "search") {
      return (
        <div className="p-8">
          <h2 className="font-bold text-xl mb-4">Search Papers</h2>
          {/* Place Search Component Here */}
          <div className="bg-gray-100 p-6 rounded-xl text-gray-500">Search bar + results coming soon</div>
        </div>
      );
    }
    if (activeTab === "settings") {
      return (
        <div className="p-8">
          <h2 className="font-bold text-xl mb-4">Settings</h2>
          {/* Settings form here */}
          <div className="bg-gray-100 p-6 rounded-xl text-gray-500">Settings form coming soon</div>
        </div>
      );
    }
    if (activeTab === "manuscript") {
      return (
        <div className="p-8">
          <h2 className="font-bold text-xl mb-4">Manuscript</h2>
          {/* Manuscript editor goes here */}
          <textarea
            className="w-full min-h-[250px] p-3 rounded-xl border"
            placeholder="Write your manuscript here..."
          />
        </div>
      );
    }
    // Active Papers or Semi-useful Papers
    const isActive = activeTab === "active";
    const papers = project ? (isActive ? project.activePapers : project.semiUsefulPapers) : [];
    return (
      <div className="p-8">
        <h2 className="font-bold text-xl mb-4">
          {isActive ? "Active Papers" : "Semi-useful Papers"}
        </h2>
        <ul>
          {(papers && papers.length > 0) ? (
            papers.map((paper: any) => (
              <li
                key={paper._id}
                className="mb-4 p-4 bg-white border rounded-xl shadow hover:bg-gray-50 transition"
              >
                <div className="font-semibold">{paper.title || "Untitled Paper"}</div>
                {/* PDF viewer and chatbot can go here */}
                <div className="text-sm text-gray-400">PDF viewer/chatbot coming soon</div>
              </li>
            ))
          ) : (
            <div className="text-gray-500">No papers in this list.</div>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg rounded-r-2xl p-6 flex flex-col gap-2 border-r">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">{project?.name || "Project"}</h1>
        <nav className="flex flex-col gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`text-left px-4 py-2 rounded-xl transition font-medium ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-100 text-gray-700"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Viewer */}
      <main className="flex-1 p-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-lg text-gray-500">
            Loading project...
          </div>
        ) : (
          renderViewer()
        )}
      </main>
    </div>
  );
};

export default ProjectPage;
