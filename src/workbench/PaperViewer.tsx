import React, { useEffect, useState, useRef } from 'react';
import type { Paper } from '../../database.types';
import supabase from '../services/supabaseClient';
import WebViewer from '@pdftron/pdfjs-express';

interface PaperViewerProps {
  selectedPaper: Paper | null;
}

const PaperViewer: React.FC<PaperViewerProps> = ({ selectedPaper }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const [instance, setInstance] = useState<any>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // — Guards / state for syncing —
  const isImportingRef = useRef(false);
  const lastSavedXfdfRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // — INIT WEBVIEWER —
  useEffect(() => {
    if (viewerRef.current && !initRef.current) {
      initRef.current = true;
      WebViewer({ 
        path: '/webviewer',
        // TODO: Add logic to remove these elements elsewhere (including the shortcuts)
        disabledElements: [
          'toolbarGroup-Shapes',
          'toolbarGroup-Insert',
          'toolbarGroup-FillAndSign',
        ],
      }, viewerRef.current)
      .then(
        (inst: any) => {
          setInstance(inst);
          inst.Core.documentViewer.addEventListener(
            'documentLoadFailed',
            (evt: any) => console.error('PDF failed to load:', evt)
          );
          inst.UI.setZoomStepFactors([
            { step: 7,  startZoom: 0   },  
            { step: 10, startZoom: 200 },
          ]);
        }
      );
    }
  }, []);

  // — FETCH SIGNED URL —
  useEffect(() => {
    if (!selectedPaper) return;
    setError(null);
    setSignedUrl(null);

    (async () => {
      setLoading(true);
      try {
        const { data, error: authErr } = await supabase.auth.getSession();
        if (authErr || !data?.session?.access_token) {
          throw new Error('Not authenticated');
        }
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/papers/${selectedPaper.id}/signed-url`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Fetch failed: ${res.status} – ${text}`);
        }
        const { signed_url } = await res.json();
        setSignedUrl(signed_url);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedPaper]);

  // — LOAD DOC & IMPORT EXISTING ANNOTATIONS ONCE —
  useEffect(() => {
    if (!instance || !signedUrl || !selectedPaper) return;

    instance.loadDocument(signedUrl, { filename: selectedPaper.filename });

    const dv = instance.Core.documentViewer;
    const annotManager = instance.Core.annotationManager;

    const onDocLoaded = async () => {
      isImportingRef.current = true;
      try {
        const { data, error } = await supabase
          .from('papers')
          .select('annotations')
          .eq('id', selectedPaper.id)
          .single();
        if (error) throw error;

        for (const xfdf of (data?.annotations ?? [])) {
          annotManager.importAnnotations(xfdf);
        }
      } catch (e: any) {
        console.error('Failed to load annotations:', e);
        setError('Could not load saved annotations');
      } finally {
        isImportingRef.current = false;
        dv.removeEventListener('documentLoaded', onDocLoaded);
      }
    };

    dv.addEventListener('documentLoaded', onDocLoaded);
    return () => {
      dv.removeEventListener('documentLoaded', onDocLoaded);
    };
  }, [instance, signedUrl, selectedPaper]);

  // — SYNC USER EDITS (debounced & deduped) —
  useEffect(() => {
    if (!instance || !selectedPaper) return;

    const annotManager = instance.Core.annotationManager;

    const scheduleSave = (action: string) => {
      if (isImportingRef.current) return;
      if (!['add', 'modify', 'delete'].includes(action)) return;

      // clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // schedule a save 1s after the last event
      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const fullXfdf = await annotManager.exportAnnotations();

          // skip if nothing changed
          if (fullXfdf === lastSavedXfdfRef.current) return;

          lastSavedXfdfRef.current = fullXfdf;

          const {
            data: { session },
            error: authErr,
          } = await supabase.auth.getSession();
          if (authErr || !session?.access_token) {
            throw new Error('Not authenticated');
          }

          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/papers/${selectedPaper.id}/annotations`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify([fullXfdf]),
            }
          );
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Save failed: ${res.status} – ${txt}`);
          }
        } catch (e: any) {
          console.error('Error saving annotations:', e);
        }
      }, 1000);
    };

    const onAnnotationChanged = (_annots: any[], action: string) => {
      scheduleSave(action);
    };

    annotManager.addEventListener(
      'annotationChanged',
      onAnnotationChanged
    );
    return () => {
      annotManager.removeEventListener(
        'annotationChanged',
        onAnnotationChanged
      );
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [instance, selectedPaper]);

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
