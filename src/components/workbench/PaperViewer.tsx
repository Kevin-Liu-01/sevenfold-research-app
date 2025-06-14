import React, { useEffect, useState, useRef } from 'react';
import type { Paper } from '../../../database.types';
import supabase from '../../services/supabaseClient';
import WebViewer from '@pdftron/pdfjs-express';

interface PaperViewerProps {
  selectedPaper: Paper | null;
}

const PaperViewer: React.FC<PaperViewerProps> = ({ selectedPaper }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const initRef = useRef<boolean>(false);        // ← guard flag
  const [instance, setInstance] = useState<any>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // — INITIALIZE WEBVIEWER ONCE —
  useEffect(() => {
    if (viewerRef.current && !initRef.current) {
      initRef.current = true;
      WebViewer(
        {
          path: '/webviewer/lib',  // your SDK public folder
        },
        viewerRef.current
      ).then((inst: any) => {
        setInstance(inst);
      });
    }
  }, []);  // empty deps

  // — FETCH SIGNED URL WHEN PAPER CHANGES —
  useEffect(() => {
    setSignedUrl(null);
    setError(null);
    if (!selectedPaper) return;

    const fetchUrl = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.access_token) {
          throw new Error('Not authenticated');
        }
        const token = data.session.access_token;
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/papers/${selectedPaper.id}/signed-url`,
          { headers: { Authorization: `Bearer ${token}` } }
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

  // — LOAD DOCUMENT WHEN BOTH INSTANCE AND URL ARE READY —
  useEffect(() => {
    if (instance && signedUrl) {
      instance.loadDocument(signedUrl, { filename: selectedPaper!.filename });
    }
  }, [instance, signedUrl, selectedPaper?.filename]);

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
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            Loading…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-600 z-10">
            {error}
          </div>
        )}
        <div
          ref={viewerRef}
          className="w-full h-full"
          style={{ visibility: instance ? 'visible' : 'hidden' }}
        />
      </div>
    </div>
  );
};

export default PaperViewer;
