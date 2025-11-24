import { useCallback, useEffect, useRef, useState } from "react";
import { Tree } from "react-arborist";
import type { NodeApi } from "react-arborist";

import { filesApi } from "@/modules/fileTree/api/filesApi";
import { FileTreeModals } from "@/modules/fileTree/FileTreeModals";
import { FileTreeNodeRow } from "@/modules/fileTree/components/FileTreeNodeRow";
import { useFileTreeActions } from "@/modules/fileTree/hooks/useFileTreeActions";
import { Button } from "@/shared/components/ui/button";
import { useAppStore } from "@/shared/state/appStore";
import type { FileNode } from "@/shared/types/domain";

const isLatexFile = (file: FileNode) => {
  if (file.assetType !== "file") return false;
  const mime = file.mimeType?.toLowerCase() ?? "";
  const name = file.name.toLowerCase();
  const isTex = mime.includes("tex") || name.endsWith(".tex");
  return isTex && file.isInline !== false;
};

const isImageFile = (file: FileNode) => {
  if (file.assetType !== "file") return false;
  const mime = file.mimeType?.toLowerCase() ?? "";
  const name = file.name.toLowerCase();
  return mime.startsWith("image/") || /\.(png|jpe?g|gif|svg|bmp|webp)$/i.test(name);
};

export const FileTreePanel = () => {
  const { activeProjectId, setActiveFile } = useAppStore();
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewLatex, setShowNewLatex] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [treeHeight, setTreeHeight] = useState(0);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const lastServerState = useRef<FileNode[] | null>(null);
  const refreshTree = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const fresh = await filesApi.fetchTree(activeProjectId);
      setTree(fresh);
      lastServerState.current = fresh;
    } catch (err) {
      console.error("Failed to refresh file tree", err);
    }
  }, [activeProjectId]);
  const {
    handleAddNode,
    handleMove,
    handleRename,
    handleDelete,
    isDropDisabled,
  } = useFileTreeActions({
    activeProjectId,
    setTree,
    setError,
    lastServerState,
  });

  useEffect(() => {
    setActiveFile(null);
  }, [activeProjectId]);

  useEffect(() => {
    if (!activeProjectId) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTree = await filesApi.fetchTree(activeProjectId);
        if (!cancelled) {
          setTree(fetchedTree);
          lastServerState.current = fetchedTree;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load files");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, setActiveFile]);

  useEffect(() => {
    const container = treeContainerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setTreeHeight(container.clientHeight);
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setTreeHeight(entry.contentRect.height);
        }
      });
      observer.observe(container);
    } else {
      updateHeight();
    }

    updateHeight();

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [activeProjectId, loading]);

  const arboristHeight = treeHeight || 320;

  const handleSelect = useCallback(
    (nodes: NodeApi<FileNode>[]) => {
      const target = nodes[nodes.length - 1] ?? null;

      if (!target) {
        setActiveFile(null);
        return;
      }

      const file = target.data;
      if (file.assetType !== "file") {
        return;
      }

      if (isLatexFile(file) || isImageFile(file)) {
        setActiveFile({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          isInline: file.isInline,
        });
      } else {
        setActiveFile(null);
      }
    },
    [setActiveFile],
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">File Tree</p>

      {error ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {!activeProjectId ? (
        <div className="mt-3 rounded-md border border-border-soft bg-surface-panel px-3 py-2 text-xs text-text-secondary">
          Select a project to load its files.
        </div>
      ) : loading ? (
        <div className="mt-3 text-xs text-text-secondary">Loading file tree…</div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* File tree action buttons */}
            <Button
              shape="icon"
              size="sm"
              variant="outline"
              onClick={() => setShowNewLatex(true)}
              aria-label="New LaTeX file"
              className="border-border-soft bg-surface-panel hover:border-border-medium hover:bg-surface-contrast"
            >
              <img src="/filetree_file.svg" alt="" className="h-5 w-5" />
            </Button>
            <Button
              shape="icon"
              size="sm"
              variant="outline"
              onClick={() => setShowNewFolder(true)}
              aria-label="New folder"
              className="border-border-soft bg-surface-panel hover:border-border-medium hover:bg-surface-contrast"
            >
              <img src="/filetree_closed_folder.svg" alt="" className="h-5 w-5" />
            </Button>
            <Button
              shape="icon"
              size="sm"
              variant="outline"
              onClick={() => setShowUpload(true)}
              aria-label="Upload file"
              className="border-border-soft bg-surface-panel hover:border-border-medium hover:bg-surface-contrast"
            >
              <img src="/filetree_upload.svg" alt="" className="h-5 w-5" />
            </Button>
            {/* File tree action buttons */}
          </div>
          <div className="mt-3 flex-1 min-h-0">
            <div
              ref={treeContainerRef}
              className="flex h-full flex-col overflow-hidden rounded-xl border border-border-soft bg-surface-panel"
            >
              <Tree
                data={tree}
                height={arboristHeight}
                width="100%"
                indent={20}
                rowHeight={32}
                paddingTop={8}
                paddingBottom={8}
                disableMultiSelection={false}
                openByDefault={false}
                className="h-full"
                onMove={handleMove}
                onSelect={handleSelect}
                disableDrop={isDropDisabled}
                onRename={handleRename}
                onDelete={handleDelete}
              >
                {FileTreeNodeRow}
              </Tree>
            </div>
          </div>
        </>
      )}

      <FileTreeModals
        activeProjectId={activeProjectId}
        showNewLatex={showNewLatex}
        showNewFolder={showNewFolder}
        showUpload={showUpload}
        onCloseNewLatex={() => setShowNewLatex(false)}
        onCloseNewFolder={() => setShowNewFolder(false)}
        onCloseUpload={() => setShowUpload(false)}
        onAddNode={handleAddNode}
        onRefreshTree={refreshTree}
        onError={(message) => setError(message)}
      />
    </div>
  );
};
