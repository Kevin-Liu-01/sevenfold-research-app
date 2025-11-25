import { useCallback, useMemo, useState } from "react";

import { compileApi } from "@/modules/compilePreview/api/compileApi";
import { Button } from "@/shared/components/ui/button";
import { useAppStore } from "@/shared/state/appStore";

export const CompilePreviewPanel = () => {
  const { activeProjectId, activeFile } = useAppStore();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Ready to compile");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const entryLabel = useMemo(() => {
    if (!activeFile) return "No entry file selected";
    return `Entry file: ${activeFile.name}`;
  }, [activeFile]);

  const canCompile = !!activeProjectId && !!activeFile;

  const handleCompile = useCallback(async () => {
    if (!activeProjectId || !activeFile) return;
    setLoading(true);
    setError(null);
    setStatus("Compiling…");
    setPdfUrl(null);
    try {
      const blob = await compileApi.compileProjectAsset(activeProjectId, activeFile.id);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStatus("Compilation succeeded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Compilation failed";
      setError(message);
      setStatus(message);
    } finally {
      setLoading(false);
    }
  }, [activeFile, activeProjectId]);

  return (
    <section className="flex min-h-[85vh] flex-shrink-0 flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Compilation</p>
          <p className="text-base font-semibold text-text-primary">Tectonic · {entryLabel}</p>
        </div>
        <Button
          onClick={handleCompile}
          disabled={!canCompile || loading}
          className="rounded-full px-4 py-2 text-sm font-semibold shadow"
        >
          {loading ? "Compiling…" : "Compile"}
        </Button>
      </div>
      <div className="mt-4 flex-1 rounded-xl border border-dashed border-border-soft bg-surface-panel p-4 text-sm text-text-primary">
        {error ? (
          <div className="text-red-600">{error}</div>
        ) : pdfUrl ? (
          <div className="flex h-full w-full items-stretch">
            <iframe
              src={pdfUrl}
              title="Compiled PDF"
              className="h-full w-full rounded border border-border-soft"
            />
          </div>
        ) : (
          <div className="text-text-secondary">{status}</div>
        )}
      </div>
    </section>
  );
};
