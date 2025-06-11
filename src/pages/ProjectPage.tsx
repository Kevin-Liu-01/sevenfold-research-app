import React, { useState, useEffect } from 'react';
import Sidebar from '../components/workbench/Sidebar';
import SettingsViewer from '../components/workbench/SettingsViewer';
import UploadViewer from '../components/workbench/UploadViewer';
import SearchViewer from '../components/workbench/SearchViewer';
import PaperViewer from '../components/workbench/PaperViewer';
import Editor from '../components/workbench/Editor';
import { useParams } from 'react-router-dom';
import supabase from '../services/supabaseClient';
import type { Paper } from '../../database.types';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams();
  const [activeViewer, setActiveViewer] = useState('search');
  const [sourcePapers, setSourcePapers] = useState<Paper[]>([]);
  const [candidatePapers, setCandidatePapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const refreshSidebar = async () => {
    if (!projectId) return;
    const { data: papers, error } = await supabase
      .from('papers')
      .select('*')
      .eq('project_id', projectId);
    if (error) {
      console.error('Error fetching papers:', error.message);
      return;
    }
    setSourcePapers(papers.filter(p => p.type === 'source'));
    setCandidatePapers(papers.filter(p => p.type === 'candidate'));
  };

  useEffect(() => {
    refreshSidebar();
  }, [projectId]);

  const handlePaperSelect = (paper: Paper) => {
    setSelectedPaper(paper);
  };

  let ViewerComponent;
  switch (activeViewer) {
    case 'settings':
      ViewerComponent = <SettingsViewer />;
      break;
    case 'upload':
      ViewerComponent = <UploadViewer refreshSidebar={refreshSidebar} />;
      break;
    case 'search':
      ViewerComponent = <SearchViewer />;
      break;
    case 'paper':
      ViewerComponent = <PaperViewer selectedPaper={selectedPaper} />;
      break;
    case 'editor':
      ViewerComponent = <Editor />;
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
      />
      <main className="flex-1 bg-white">{ViewerComponent}</main>
    </div>
  );
};

export default ProjectPage;
