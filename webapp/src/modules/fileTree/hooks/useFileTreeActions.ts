import { useCallback } from "react"
import type { Dispatch, MutableRefObject, SetStateAction } from "react"
import type { NodeApi } from "react-arborist"

import { filesApi } from "@/modules/fileTree/api/filesApi"
import type { UpdateFileRequest } from "@/modules/fileTree/api/filesApi"
import type { FileNode } from "@/shared/types/domain"

const addNodeToTree = (
  nodes: FileNode[],
  parentId: string | null | undefined,
  newNode: FileNode,
): FileNode[] => {
  if (!parentId) {
    return [...nodes, newNode]
  }

  return nodes.map((node) => {
    if (node.id === parentId && node.assetType === "folder") {
      const children = node.children ?? []
      return { ...node, children: [...children, newNode] }
    }

    if (node.children?.length) {
      return { ...node, children: addNodeToTree(node.children, parentId, newNode) }
    }

    return node
  })
}

const removeNodeFromTree = (
  nodes: FileNode[],
  targetId: string,
): { tree: FileNode[]; removed: FileNode | null } => {
  let removed: FileNode | null = null

  const walk = (items: FileNode[]): FileNode[] => {
    const next: FileNode[] = []
    for (const item of items) {
      if (item.id === targetId) {
        removed = item
        continue
      }
      if (item.children?.length) {
        const { tree: updatedChildren, removed: childRemoved } = removeNodeFromTree(
          item.children,
          targetId,
        )
        if (childRemoved) {
          removed = childRemoved
          next.push({ ...item, children: updatedChildren })
          continue
        }
        next.push(item)
      } else {
        next.push(item)
      }
    }
    return next
  }

  return { tree: walk(nodes), removed }
}

const insertNodeIntoTree = (
  nodes: FileNode[],
  parentId: string | null | undefined,
  index: number | undefined,
  newNode: FileNode,
): FileNode[] => {
  if (parentId === null) {
    const insertionIndex = typeof index === "number" ? Math.min(index, nodes.length) : nodes.length
    const next = [...nodes]
    next.splice(insertionIndex, 0, newNode)
    return next
  }

  return nodes.map((node) => {
    if (node.id === parentId && node.assetType === "folder") {
      const children = node.children ?? []
      const insertionIndex =
        typeof index === "number" ? Math.min(index, children.length) : children.length
      const nextChildren = [...children]
      nextChildren.splice(insertionIndex, 0, newNode)
      return { ...node, children: nextChildren }
    }
    if (node.children?.length) {
      const updated = insertNodeIntoTree(node.children, parentId, index, newNode)
      if (updated !== node.children) {
        return { ...node, children: updated }
      }
    }
    return node
  })
}

const renameNodeInTree = (nodes: FileNode[], targetId: string, name: string): FileNode[] =>
  nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, name }
    }
    if (node.children?.length) {
      const updatedChildren = renameNodeInTree(node.children, targetId, name)
      if (updatedChildren !== node.children) {
        return { ...node, children: updatedChildren }
      }
    }
    return node
  })

type UseFileTreeActionsParams = {
  activeProjectId?: string
  setTree: Dispatch<SetStateAction<FileNode[]>>
  setError: Dispatch<SetStateAction<string | null>>
  lastServerState: MutableRefObject<FileNode[] | null>
}

export const useFileTreeActions = ({
  activeProjectId,
  setTree,
  setError,
  lastServerState,
}: UseFileTreeActionsParams) => {
  const handleAddNode = useCallback(
    (node: FileNode) => {
      setTree((prev) => addNodeToTree(prev, node.parentId ?? null, node))
    },
    [setTree],
  )

  const handleMove = useCallback(
    async ({
      dragIds,
      parentId,
      index,
    }: {
      dragIds: string[]
      parentId: string | null | undefined
      index: number
    }) => {
      if (!activeProjectId) return

      setTree((prevTree) => {
        let working = prevTree
        for (const id of dragIds) {
          const { tree: withoutNode, removed } = removeNodeFromTree(working, id)
          if (!removed) {
            continue
          }
          const updatedNode: FileNode = { ...removed, parentId: parentId ?? null }
          working = insertNodeIntoTree(withoutNode, parentId, index, updatedNode)
        }
        return working
      })

      try {
        for (const id of dragIds) {
          const updateRequest: UpdateFileRequest = {
            newParentId: parentId ?? null,
          }
          await filesApi.updateFileMetadata(activeProjectId, id, updateRequest)
        }
      } catch (err) {
        console.error("Failed to update file position:", err)
        if (lastServerState.current) {
          setTree(lastServerState.current)
        }
        return
      }

      try {
        const fresh = await filesApi.fetchTree(activeProjectId)
        setTree(fresh)
        lastServerState.current = fresh
      } catch {
        /* ignore */
      }
    },
    [activeProjectId, lastServerState, setTree],
  )

  const handleRename = useCallback(
    async ({ id, name }: { id: string; name: string }) => {
      if (!activeProjectId) return
      setTree((prev) => renameNodeInTree(prev, id, name))
      try {
        await filesApi.updateFileMetadata(activeProjectId, id, { newName: name })
        const fresh = await filesApi.fetchTree(activeProjectId)
        setTree(fresh)
        lastServerState.current = fresh
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to rename file")
        if (lastServerState.current) {
          setTree(lastServerState.current)
        }
      }
    },
    [activeProjectId, lastServerState, setError, setTree],
  )

  const handleDelete = useCallback(
    async ({ ids }: { ids: string[] }) => {
      if (!activeProjectId) return
      setTree((prev) => {
        let working = prev
        ids.forEach((id) => {
          const { tree: withoutNode } = removeNodeFromTree(working, id)
          working = withoutNode
        })
        return working
      })

      try {
        for (const id of ids) {
          await filesApi.deleteFile(activeProjectId, id)
        }
        const fresh = await filesApi.fetchTree(activeProjectId)
        setTree(fresh)
        lastServerState.current = fresh
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete file")
        if (lastServerState.current) {
          setTree(lastServerState.current)
        }
      }
    },
    [activeProjectId, lastServerState, setError, setTree],
  )

  const isDropDisabled = useCallback(
    (
      {
        parentNode,
        dragNodes,
      }: {
        parentNode: NodeApi<FileNode>
        dragNodes: NodeApi<FileNode>[]
        index: number
      },
    ) => {
      const isDescendant = (parent: FileNode, childId: string): boolean => {
        if (!parent.children) return false
        for (const child of parent.children) {
          if (child.id === childId) return true
          if (child.assetType === "folder" && isDescendant(child, childId)) return true
        }
        return false
      }

      for (const draggedNode of dragNodes) {
        if (isDescendant(draggedNode.data, parentNode.id)) {
          return true
        }
      }

      if (parentNode.id === "__REACT_ARBORIST_INTERNAL_ROOT__") {
        for (const draggedNode of dragNodes) {
          if (draggedNode.parent?.id === "__REACT_ARBORIST_INTERNAL_ROOT__") {
            return true
          }
        }
        return false
      }

      if (
        parentNode &&
        parentNode.id !== "__REACT_ARBORIST_INTERNAL_ROOT__" &&
        parentNode.data.assetType !== "folder"
      ) {
        return true
      }

      return false
    },
    [],
  )

  return {
    handleAddNode,
    handleMove,
    handleRename,
    handleDelete,
    isDropDisabled,
  }
}
