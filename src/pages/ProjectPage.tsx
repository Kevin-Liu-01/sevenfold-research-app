import React, { useState } from 'react';
import Sidebar from '../components/workbench/Sidebar';
import SettingsViewer from '../components/workbench/SettingsViewer';
import UploadViewer from '../components/workbench/UploadViewer';
import SearchViewer from '../components/workbench/SearchViewer';
import PaperViewer from '../components/workbench/PaperViewer';

const ProjectPage: React.FC = () => {
  const [activeViewer, setActiveViewer] = useState('search');

  let ViewerComponent;
  switch (activeViewer) {
    case 'settings':
      ViewerComponent = <SettingsViewer />;
      break;
    case 'upload':
      ViewerComponent = <UploadViewer />;
      break;
    case 'search':
      ViewerComponent = <SearchViewer />;
      break;
    case 'paper':
    default:
      ViewerComponent = <PaperViewer />;
      break;
  }

  return (
    <div className="flex h-screen">
      <Sidebar activeViewer={activeViewer} setActiveViewer={setActiveViewer} />
      <main className="flex-1 bg-white">{ViewerComponent}</main>
    </div>
  );
};

export default ProjectPage;