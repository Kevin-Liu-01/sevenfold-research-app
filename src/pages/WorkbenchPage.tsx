import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import SettingsViewer from "../components/viewers/SettingsViewer";
import UploadViewer from "../components/viewers/UploadViewer";
import SearchViewer from "../components/viewers/SearchViewer";
import PaperViewer from "../components/viewers/PaperViewer";
import ComposeViewer from "../components/viewers/ComposeViewer";

import { useParams } from "react-router-dom";
import supabase from "../services/supabaseClient";
import type { Paper } from "../../database.types";

const WorkbenchPage: React.FC = () => {
  const { projectId } = useParams();
  const [activeViewer, setActiveViewer] = useState("search");
  const [sourcePapers, setSourcePapers] = useState<Paper[]>([]);
  const [candidatePapers, setCandidatePapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    null
  );

  const refreshSidebar = async () => {
    if (!projectId) return;
    const { data: papers, error } = await supabase
      .from("papers")
      .select("*")
      .eq("project_id", projectId);
    if (error) {
      console.error("Error fetching papers:", error.message);
      return;
    }
    setSourcePapers(papers.filter((p) => p.type === "source"));
    setCandidatePapers(papers.filter((p) => p.type === "candidate"));
  };

  useEffect(() => {
    refreshSidebar();
  }, [projectId]);

  const handlePaperSelect = (paper: Paper) => {
    setSelectedPaper(paper);
  };

  const createNewDocument = async () => {
    if (!projectId) return;
    const { data, error } = await supabase
      .from("documents")
      .insert({
        project_id: projectId,
        title: "Untitled Document",
        content: "",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating document:", error.message);
      return;
    }
    setCurrentDocumentId(data.id);
    setActiveViewer("compose");
  };

  let ViewerComponent;
  switch (activeViewer) {
    case "settings":
      ViewerComponent = <SettingsViewer />;
      break;
    case "upload":
      ViewerComponent = <UploadViewer refreshSidebar={refreshSidebar} />;
      break;
    case "search":
      ViewerComponent = <SearchViewer />;
      break;
    case "paper":
      ViewerComponent = <PaperViewer selectedPaper={selectedPaper} />;
      break;
    case "compose":
      ViewerComponent = <ComposeViewer projectId={projectId!} />;
      break;
    default:
      ViewerComponent = <SearchViewer />;
      break;
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        activeViewer={activeViewer}
        setActiveViewer={setActiveViewer}
        sourcePapers={sourcePapers}
        candidatePapers={candidatePapers}
        onPaperSelect={handlePaperSelect}
        selectedPaperId={selectedPaper?.id || null}
        onCreateDocument={createNewDocument}
      />
      <main className="ml-[4rem] flex-1 bg-white">{ViewerComponent}</main>
    </div>
  );
};

export default WorkbenchPage;
