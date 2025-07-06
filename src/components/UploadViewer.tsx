import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../services/supabaseClient';

interface UploadViewerProps {
  refreshSidebar: () => void; 
}

const UploadViewer: React.FC<UploadViewerProps> = ({ refreshSidebar }) => {
  const { projectId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paperType, setPaperType] = useState<'source' | 'candidate'>('source');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files allowed.');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !projectId) {
      alert('Please select a file and ensure project ID is available.');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      alert('You must be logged in.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('project_id', projectId);
    formData.append('paper_type', paperType);

    setUploading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload-paper`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      // const data = await res.json();
      alert('Upload successful');
      setSelectedFile(null);

      // // Store the preview URL in localStorage for later use
      // if (data.preview_url) {
      //   localStorage.setItem(`paper_preview_${data.paper_id}`, data.preview_url);
      // }

      await new Promise((res) => setTimeout(res, 1000));
      refreshSidebar(); 
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Upload Papers</h2>

      <select
        value={paperType}
        onChange={(e) => setPaperType(e.target.value as 'source' | 'candidate')}
        className="mb-4 border border-gray-300 rounded px-3 py-2"
      >
        <option value="source">Source</option>
        <option value="candidate">Candidate</option>
      </select>

      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={handleSelectFile}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={uploading}
        >
          Select File
        </button>
        {selectedFile && <span className="text-gray-700">{selectedFile.name}</span>}
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
        disabled={!selectedFile || uploading}
      >
        {uploading ? 'Submitting...' : 'Submit'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadViewer;
