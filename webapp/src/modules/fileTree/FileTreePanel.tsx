import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { NodeRendererProps } from "react-arborist";
import { Tree } from "react-arborist";

import { filesApi } from "@/modules/fileTree/api/filesApi";
import { FileTreeModals } from "@/modules/fileTree/FileTreeModals";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useAppStore } from "@/shared/state/appStore";
import type { FileNode } from "@/shared/types/domain";

const placeholderTree: FileNode[] = [
  {
    id: "root-1",
    name: "main.tex",
    assetType: "file",
    mimeType: "text/x-tex",
    isInline: true,
  },
  {
    id: "root-2",
    name: "sections",
    assetType: "folder",
    children: [
      {
        id: "child-2a",
        name: "01-introduction.tex",
        assetType: "file",
        mimeType: "text/x-tex",
        isInline: true,
      },
      {
        id: "child-2b",
        name: "02-methods.tex",
        assetType: "file",
        mimeType: "text/x-tex",
        isInline: true,
      },
    ],
  },
  {
    id: "root-3",
    name: "figures",
    assetType: "folder",
    children: [
      {
        id: "child-3a",
        name: "architecture.png",
        assetType: "file",
        mimeType: "image/png",
        isInline: false,
      },
    ],
  },
];

const addNodeToTree = (nodes: FileNode[], parentId: string | null | undefined, newNode: FileNode): FileNode[] => {
  if (!parentId) {
    return [...nodes, newNode];
  }

  return nodes.map((node) => {
    if (node.id === parentId && node.assetType === "folder") {
      const children = node.children ?? [];
      return { ...node, children: [...children, newNode] };
    }

    if (node.children?.length) {
      return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
    }

    return node;
  });
};

const FileTreeNodeRow = ({ node, style, dragHandle }: NodeRendererProps<FileNode>) => {
  const isFolder = node.data.assetType === "folder";
  const iconSrc = isFolder ? "/filetree_folder.svg" : "/filetree_file.svg";

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isFolder) {
      node.toggle();
    }
  };

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        "flex h-[32px] items-center gap-2 rounded-md px-2 text-sm text-text-primary transition",
        node.isSelected ? "bg-surface-panel" : "hover:bg-surface-contrast",
      )}
      onClick={(event) => node.handleClick(event)}
      onDoubleClick={() => {
        if (isFolder) {
          node.toggle();
        }
      }}
    >
      {isFolder ? (
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded text-xs text-text-secondary hover:bg-surface-contrast"
          aria-label={node.isOpen ? "Collapse folder" : "Expand folder"}
          onClick={handleToggle}
        >
          {node.isOpen ? "▾" : "▸"}
        </button>
      ) : (
        <span className="w-5" />
      )}
      <img src={iconSrc} alt="" className="h-4 w-4" aria-hidden />
      <span className="truncate font-medium">{node.data.name}</span>
    </div>
  );
};

export const FileTreePanel = () => {
  const { activeProjectId } = useAppStore();
  const [tree, setTree] = useState<FileNode[]>(placeholderTree);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewLatex, setShowNewLatex] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [treeHeight, setTreeHeight] = useState(0);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);

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
  }, [activeProjectId]);

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

  const handleAddNode = (node: FileNode) => {
    setTree((prev) => addNodeToTree(prev, node.parentId ?? null, node));
  };

  const arboristHeight = treeHeight || 320;

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
              <img src="/filetree_folder.svg" alt="" className="h-5 w-5" />
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
                disableMultiSelection
                openByDefault
                className="h-full"
              >
                {FileTreeNodeRow}
              </Tree>
            </div>
          </div>
        </>
      )}

      <div className="mt-auto rounded-xl border border-dashed border-border-soft p-3 text-xs text-text-secondary">
        React-arborist powers the tree view; drag-and-drop, inline rename, and context menus will be
        layered in once the backend endpoints are wired.
      </div>

      <FileTreeModals
        activeProjectId={activeProjectId}
        showNewLatex={showNewLatex}
        showNewFolder={showNewFolder}
        showUpload={showUpload}
        onCloseNewLatex={() => setShowNewLatex(false)}
        onCloseNewFolder={() => setShowNewFolder(false)}
        onCloseUpload={() => setShowUpload(false)}
        onAddNode={handleAddNode}
        onError={(message) => setError(message)}
      />
    </div>
  );
};
