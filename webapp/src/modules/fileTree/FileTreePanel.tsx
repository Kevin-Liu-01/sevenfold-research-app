import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { NodeRendererProps, NodeApi } from "react-arborist";
import { Tree } from "react-arborist";

import { filesApi } from "@/modules/fileTree/api/filesApi";
import type { CreateFileRequest, UpdateFileRequest } from "@/modules/fileTree/api/filesApi";
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

const removeNodeFromTree = (
  nodes: FileNode[],
  targetId: string,
): { tree: FileNode[]; removed: FileNode | null } => {
  let removed: FileNode | null = null;

  const walk = (items: FileNode[]): FileNode[] => {
    const next: FileNode[] = [];
    for (const item of items) {
      if (item.id === targetId) {
        removed = item;
        continue;
      }
      if (item.children?.length) {
        const { tree: updatedChildren, removed: childRemoved } = removeNodeFromTree(
          item.children,
          targetId,
        );
        if (childRemoved) {
          removed = childRemoved;
          next.push({ ...item, children: updatedChildren });
          continue;
        }
        next.push(item);
      } else {
        next.push(item);
      }
    }
    return next;
  };

  return { tree: walk(nodes), removed };
};

const insertNodeIntoTree = (
  nodes: FileNode[],
  parentId: string | null | undefined,
  index: number | undefined,
  newNode: FileNode,
): FileNode[] => {
  if (parentId === null) {
    const insertionIndex = typeof index === "number" ? Math.min(index, nodes.length) : nodes.length;
    const next = [...nodes];
    next.splice(insertionIndex, 0, newNode);
    return next;
  }

  return nodes.map((node) => {
    if (node.id === parentId && node.assetType === "folder") {
      const children = node.children ?? [];
      const insertionIndex =
        typeof index === "number" ? Math.min(index, children.length) : children.length;
      const nextChildren = [...children];
      nextChildren.splice(insertionIndex, 0, newNode);
      return { ...node, children: nextChildren };
    }
    if (node.children?.length) {
      const updated = insertNodeIntoTree(node.children, parentId, index, newNode);
      if (updated !== node.children) {
        return { ...node, children: updated };
      }
    }
    return node;
  });
};

const renameNodeInTree = (nodes: FileNode[], targetId: string, name: string): FileNode[] =>
  nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, name };
    }
    if (node.children?.length) {
      const updatedChildren = renameNodeInTree(node.children, targetId, name);
      if (updatedChildren !== node.children) {
        return { ...node, children: updatedChildren };
      }
    }
    return node;
  });

const FileTreeNodeRow = ({ node, style, dragHandle }: NodeRendererProps<FileNode>) => {
  const [draftName, setDraftName] = useState(node.data.name);
  const isFolder = node.data.assetType === "folder";
  const iconSrc = isFolder
    ? node.isOpen
      ? "/filetree_folder.svg"
      : "/filetree_closed_folder.svg"
    : "/filetree_file.svg";

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isFolder) {
      node.toggle();
    }
  };

  if (node.isEditing) {
    return (
      <div
        ref={dragHandle}
        style={style}
        className="flex h-[32px] items-center gap-2 rounded-md bg-surface-panel px-2 text-sm text-text-primary"
        onContextMenu={(e) => e.preventDefault()}
      >
        <input
          className="flex-1 rounded border border-border-soft bg-white px-2 py-1 text-sm outline-none focus:border-accent"
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={() => node.submit(draftName)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              node.submit(draftName);
            }
            if (e.key === "Escape") {
              node.reset();
              setDraftName(node.data.name);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        "group flex h-[32px] items-center gap-2 rounded-md px-2 text-sm text-text-primary transition",
        node.isSelected ? "bg-surface-panel" : "hover:bg-surface-contrast",
      )}
      onClick={(event) => node.handleClick(event)}
      onDoubleClick={() => {
        if (isFolder) {
          node.toggle();
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        node.tree.focus(node.id);
        node.select();
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
      <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/10"
          aria-label="Rename"
          onClick={(e) => {
            e.stopPropagation();
            setDraftName(node.data.name);
            node.edit();
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <img src="/filetree_edit.svg" alt="" className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/10"
          aria-label="Delete"
          onClick={(e) => {
            e.stopPropagation();
            node.tree.delete(node);
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <img src="/filetree-delete.svg" alt="" className="h-4 w-4" aria-hidden />
        </button>
      </div>
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
  const lastServerState = useRef<FileNode[] | null>(null);

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

  const onMove = async ({
    dragIds,
    parentId,
    index,
  }: {
    dragIds: string[];
    parentId: string | null | undefined;
    index: number;
  }) => {
    if (!activeProjectId) return;

    // Optimistic move for all dragged ids
    setTree((prevTree) => {
      let working = prevTree;
      for (const id of dragIds) {
        const { tree: withoutNode, removed } = removeNodeFromTree(working, id);
        if (!removed) {
          continue;
        }
        const updatedNode: FileNode = { ...removed, parentId: parentId ?? null };
        working = insertNodeIntoTree(withoutNode, parentId, index, updatedNode);
      }
      return working;
    });

    // Persist moves sequentially; if any fail, refetch to resync
    try {
      for (const id of dragIds) {
        const updateRequest: UpdateFileRequest = {
          newParentId: parentId ?? null,
        };
        await filesApi.updateFileMetadata(activeProjectId, id, updateRequest);
      }
    } catch (err) {
      console.error("Failed to update file position:", err);
      if (lastServerState.current) {
        setTree(lastServerState.current);
      }
      return;
    }

    // sync with server after move
    try {
      const fresh = await filesApi.fetchTree(activeProjectId);
      setTree(fresh);
      lastServerState.current = fresh;
    } catch {
      /* ignore secondary failure */
    }
  };

  const handleRename = async ({ id, name }: { id: string; name: string }) => {
    if (!activeProjectId) return;
    setTree((prev) => renameNodeInTree(prev, id, name));
    try {
      await filesApi.updateFileMetadata(activeProjectId, id, { newName: name });
      const fresh = await filesApi.fetchTree(activeProjectId);
      setTree(fresh);
      lastServerState.current = fresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename file");
      if (lastServerState.current) {
        setTree(lastServerState.current);
      }
    }
  };

  const handleDelete = async ({ ids }: { ids: string[] }) => {
    if (!activeProjectId) return;
    setTree((prev) => {
      let working = prev;
      ids.forEach((id) => {
        const { tree: withoutNode } = removeNodeFromTree(working, id);
        working = withoutNode;
      });
      return working;
    });

    try {
      for (const id of ids) {
        await filesApi.deleteFile(activeProjectId, id);
      }
      const fresh = await filesApi.fetchTree(activeProjectId);
      setTree(fresh);
      lastServerState.current = fresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
      if (lastServerState.current) {
        setTree(lastServerState.current);
      }
    }
  };

  const isDropDisabled = ({parentNode, dragNodes, index}: {parentNode: NodeApi<FileNode>, dragNodes: NodeApi<FileNode>[], index: number}) => {
    // Prevent dropping a node into its descendants
    const isDescendant = (parent: FileNode, childId: string): boolean => {
      if (!parent.children) return false;
      for (const child of parent.children) {
        if (child.id === childId) return true;
        if (child.assetType === "folder" && isDescendant(child, childId)) return true;
      }
      return false;
    };

    for (const draggedNode of dragNodes) {
      if (isDescendant(draggedNode.data, parentNode.id)) {
        return true;
      }
    }

    // Prevent dropping into the root if any dragged node is already at root
    if (parentNode.id === '__REACT_ARBORIST_INTERNAL_ROOT__') {
      for (const draggedNode of dragNodes) {
        if (draggedNode.parent?.id === '__REACT_ARBORIST_INTERNAL_ROOT__') {
          return true;
        }
      }
      return false;
    }

    // Prevent dropping into non-folder nodes
    if (parentNode && parentNode.id !== '__REACT_ARBORIST_INTERNAL_ROOT__' && parentNode.data.assetType !== "folder") {
      return true;
    }

    return false;
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
                onMove={onMove}
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
