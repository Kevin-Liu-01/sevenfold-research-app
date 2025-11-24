import { useState } from "react"
import type { MouseEvent } from "react"
import type { NodeRendererProps } from "react-arborist"

import { cn } from "@/shared/lib/utils"
import type { FileNode } from "@/shared/types/domain"

export const FileTreeNodeRow = ({ node, style, dragHandle }: NodeRendererProps<FileNode>) => {
  const [draftName, setDraftName] = useState(node.data.name)
  const isFolder = node.data.assetType === "folder"
  const iconSrc = isFolder
    ? node.isOpen
      ? "/filetree_folder.svg"
      : "/filetree_closed_folder.svg"
    : "/filetree_file.svg"

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (isFolder) {
      node.toggle()
    }
  }

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
              node.submit(draftName)
            }
            if (e.key === "Escape") {
              node.reset()
              setDraftName(node.data.name)
            }
          }}
        />
      </div>
    )
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
          node.toggle()
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        node.tree.focus(node.id)
        node.select()
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
            e.stopPropagation()
            setDraftName(node.data.name)
            node.edit()
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
            e.stopPropagation()
            node.tree.delete(node)
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <img src="/filetree-delete.svg" alt="" className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
