import React from 'react';
import type { Paper } from '../../../database.types';

interface PaperViewerProps {
  selectedPaper: Paper | null;
}

const PaperViewer: React.FC<PaperViewerProps> = ({ selectedPaper }) => {
  if (!selectedPaper) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4">Paper Viewer</h2>
        <p className="text-gray-600">Select a paper to view</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">{selectedPaper.filename}</h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src={selectedPaper.file_url}
          className="w-full h-full"
          title={selectedPaper.filename}
        />
      </div>
    </div>
  );
};

export default PaperViewer;