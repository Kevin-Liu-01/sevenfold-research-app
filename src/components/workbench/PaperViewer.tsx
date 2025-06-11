import React, { useEffect, useState } from 'react';
import type { Paper } from '../../../database.types';
import supabase from '../../services/supabaseClient';

interface PaperViewerProps {
  selectedPaper: Paper | null;
}

const PaperViewer: React.FC<PaperViewerProps> = ({ selectedPaper }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSignedUrl(null);
    setError(null);

    if (!selectedPaper) return;

    const fetchUrl = async () => {
      setLoading(true);
      try {
        // 1. Get JWT from Supabase
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.access_token) {
          throw new Error('Not authenticated');
        }
        const token = data.session.access_token;

        // 2. Hit FastAPI → /api/papers/{id}/signed-url
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/papers/${selectedPaper.id}/signed-url`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(await res.text());

        const { signed_url } = await res.json();
        setSignedUrl(signed_url);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [selectedPaper]);
  
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
        {loading && <p className="p-4">Loading…</p>}
        {error && <p className="p-4 text-red-600">{error}</p>}

        {signedUrl && (
          <iframe
            key={signedUrl}
            src={signedUrl}
            className="w-full h-full"
            title={selectedPaper.filename}
          />
        )}
      </div>
    </div>
  );
};

export default PaperViewer;