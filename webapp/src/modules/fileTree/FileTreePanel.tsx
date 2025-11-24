import { useEffect, useState } from "react";

import { filesApi } from "@/modules/fileTree/api/filesApi";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";
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
  const [newLatexName, setNewLatexName] = useState("main.tex");
  const [newFolderName, setNewFolderName] = useState("new-folder");
  const [uploadFileName, setUploadFileName] = useState("");
  const [creatingLatex, setCreatingLatex] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

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

  const handleCreateLatex = async () => {
    if (!activeProjectId) return;
    try {
      setCreatingLatex(true);
      const result = await filesApi.createFile(activeProjectId, {
        parentId: null,
        name: newLatexName,
        assetType: "file",
        mimeType: "text/x-tex",
        isInline: true,
      });

      const meta = result.fileMetadata;
      const node: FileNode = {
        id: meta.id,
        name: meta.name,
        assetType: meta.assetType,
        mimeType: meta.mimeType,
        isInline: meta.isInline,
        parentId: meta.parentId,
        downloadUrl: meta.downloadUrl,
        children: [],
      };

      setTree((prev) => addNodeToTree(prev, meta.parentId ?? null, node));
      setShowNewLatex(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create file");
    } finally {
      setCreatingLatex(false);
    }
  };

const handleCreateFolder = async () => {
  if (!activeProjectId) return;
  try {
    setCreatingFolder(true);
    const result = await filesApi.createFile(activeProjectId, {
      parentId: null,
      name: newFolderName,
      assetType: "folder",
      mimeType: "inode/directory",
      isInline: false,
    });

    const meta = result.fileMetadata;
    const node: FileNode = {
      id: meta.id,
      name: meta.name,
      assetType: meta.assetType,
      mimeType: meta.mimeType,
      isInline: meta.isInline,
      parentId: meta.parentId,
      downloadUrl: meta.downloadUrl,
      children: [],
    };

    setTree((prev) => addNodeToTree(prev, meta.parentId ?? null, node));
    setShowNewFolder(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to create folder");
  } finally {
    setCreatingFolder(false);
  }
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

      <Modal
        open={showNewLatex}
        onClose={() => setShowNewLatex(false)}
        title="Create LaTeX file"
        description="Name your new .tex file and choose the parent folder once tree selection is wired."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewLatex(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLatex} disabled={!newLatexName || !activeProjectId || creatingLatex}>
              {creatingLatex ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">File name</span>
          <Input
            value={newLatexName}
            onChange={(e) => setNewLatexName(e.target.value)}
            placeholder="main.tex"
          />
        </label>
        <p className="mt-3 text-xs text-text-secondary">
          File will be created inline; upload flow will be used for non-inline assets.
        </p>
      </Modal>

      <Modal
        open={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        title="Create folder"
        description="Pick a name for the new folder. Parent selection will come from the tree."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewFolder(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName || !activeProjectId || creatingFolder}
            >
              {creatingFolder ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">Folder name</span>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="chapters"
          />
        </label>
      </Modal>

      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload file"
        description="Upload PDFs or assets; we’ll show an upload URL and status once wired."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowUpload(false)}>Upload</Button>
          </>
        }
      >
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-text-secondary">Select file</span>
            <input
              type="file"
              onChange={(e) => setUploadFileName(e.target.files?.[0]?.name ?? "")}
              className="text-sm"
            />
            {uploadFileName ? (
              <span className="text-xs text-text-secondary">Chosen: {uploadFileName}</span>
            ) : null}
          </label>
          <p className="text-xs text-text-secondary">
            Folder selection and presigned upload handling will be wired to the API.
          </p>
        </div>
      </Modal>
    </div>
  );
};
