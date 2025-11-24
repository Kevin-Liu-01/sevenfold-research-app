import { useEffect, useState } from "react";

import { filesApi } from "@/modules/fileTree/api/filesApi";
import { FileTreeModals } from "@/modules/fileTree/FileTreeModals";
import { Button } from "@/shared/components/ui/button";
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

const typeToColor: Record<FileNode["assetType"], string> = {
  folder: "text-amber-700",
  file: "text-emerald-700",
};

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

const renderNode = (node: FileNode, depth = 0) => (
  <li
    key={node.id}
    className={`group flex flex-col rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-contrast ${typeToColor[node.assetType]}`}
    style={{ marginLeft: `${depth * 12}px` }}
  >
    <div className="flex items-center gap-2">
      <span className="text-text-primary group-hover:text-accent font-medium">{node.name}</span>
    </div>
    {node.children?.length ? (
      <ul className="mt-1 space-y-1">
        {node.children.map((child) => renderNode(child, depth + 1))}
      </ul>
    ) : null}
  </li>
);

export const FileTreePanel = () => {
  const { activeProjectId } = useAppStore();
  const [tree, setTree] = useState<FileNode[]>(placeholderTree);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewLatex, setShowNewLatex] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

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

  const handleAddNode = (node: FileNode) => {
    setTree((prev) => addNodeToTree(prev, node.parentId ?? null, node));
  };


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
          <ul className="mt-3 space-y-2">
            {tree.map((node) => renderNode(node))}
          </ul>
        </>
      )}

      <div className="mt-auto rounded-xl border border-dashed border-border-soft p-3 text-xs text-text-secondary">
        Placeholder view; will be replaced by a react-arborist tree with drag-and-drop, context
        menus, and depth enforcement once the API is wired.
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
