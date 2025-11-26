import { useCallback, useMemo, useState } from "react";

import { compileApi } from "@/modules/compilePreview/api/compileApi";
import { Button } from "@/shared/components/ui/button";
import { useAppStore } from "@/shared/state/appStore";

export const CompilePreviewPanel = () => {
  const { activeProjectId, entryFile } = useAppStore();
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Ready to compile");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const entryLabel = useMemo(() => {
    if (!entryFile) return "Entry file: main.tex not found";
    return `Entry file: ${entryFile.name}`;
  }, [entryFile]);

  const canCompile = !!activeProjectId && !!entryFile;

  const handleCompile = useCallback(async () => {
    if (!activeProjectId || !entryFile) {
      setError("main.tex is missing in this project.");
      setStatus("main.tex not found");
      return;
    }
    setLoading(true);
    setError(null);
    setStatus("Compiling…");
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfBlob(null);
    try {
      const blob = await compileApi.compileProjectAsset(activeProjectId, entryFile.id);
      setPdfBlob(blob);
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
  }, [entryFile, activeProjectId]);

  const handleDownload = useCallback(() => {
    if (!pdfBlob) return;
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    const inferredName = entryFile?.name?.replace(/\.tex$/i, ".pdf") ?? "compiled.pdf";
    link.download = inferredName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, [pdfBlob, entryFile]);

  return (
    <section className="flex min-h-[85vh] flex-shrink-0 flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Compilation</p>
          <p className="text-base font-semibold text-text-primary">Tectonic · {entryLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCompile}
            disabled={!canCompile || loading}
            className="rounded-full px-4 py-2 text-sm font-semibold shadow"
          >
            {loading ? "Compiling…" : "Compile"}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!pdfBlob || loading}
            variant="outline"
            className="rounded-full px-4 py-2 text-sm font-semibold"
          >
            Download PDF
          </Button>
        </div>
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
