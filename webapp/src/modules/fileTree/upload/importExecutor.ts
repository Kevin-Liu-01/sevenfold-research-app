import { filesApi } from "@/modules/fileTree/api/filesApi"
import type { FileNode } from "@/shared/types/domain"

export type ImportEntry = {
  path: string
  file: File | Blob
}

export type ImportOptions = {
  projectId: string
  rootParentId?: string | null
  onProgress?: (status: string) => void
  maxDepth?: number
  maxTotalBytes?: number
}

type FolderRecord = {
  path: string
  parentPath: string | null
  id?: string
}

const LATEX_EXTENSIONS = [".tex", ".bib"]

const EXT_MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
}

const normalizePath = (raw: string): string => raw.replace(/\\/g, "/").replace(/^\/+/, "")

const isSafePath = (p: string) => !p.split("/").some((part) => part === ".." || part === "")

const depthOf = (p: string) => normalizePath(p).split("/").length

const inferMime = (name: string, blob: File | Blob): string => {
  const lowered = name.toLowerCase()
  if (LATEX_EXTENSIONS.some((ext) => lowered.endsWith(ext))) return "text/x-tex"
  const fromMap = Object.entries(EXT_MIME_MAP).find(([ext]) => lowered.endsWith(ext))
  if (fromMap) return fromMap[1]
  if (blob instanceof File && blob.type) return blob.type
  return "application/octet-stream"
}

const isLatex = (name: string) => {
  const lowered = name.toLowerCase()
  return LATEX_EXTENSIONS.some((ext) => lowered.endsWith(ext))
}

const runSequential = async <T>(items: T[], worker: (item: T, idx: number) => Promise<void>) => {
  for (let i = 0; i < items.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await worker(items[i], i)
  }
}

export const importEntries = async (entries: ImportEntry[], options: ImportOptions): Promise<FileNode[]> => {
  const { projectId, rootParentId = null, onProgress, maxDepth = 4, maxTotalBytes = 200 * 1024 * 1024 } = options

  if (!entries.length) {
    throw new Error("No entries to import")
  }

  const normalized = entries.map((entry) => {
    const path = normalizePath(entry.path)
    if (!isSafePath(path)) throw new Error(`Unsafe path: ${entry.path}`)
    return { ...entry, path }
  })

  const totalBytes = normalized.reduce((sum, e) => sum + (e.file.size || 0), 0)
  if (totalBytes > maxTotalBytes) throw new Error(`Archive too large (>${Math.round(maxTotalBytes / (1024 * 1024))} MB)`)

  const folders: Record<string, FolderRecord> = {}
  const files: { path: string; file: File | Blob; name: string; parentPath: string }[] = []

  normalized.forEach(({ path, file }) => {
    const parts = path.split("/")
    if (parts.length < 1) return
    const name = parts.pop() as string
    const parentPath = parts.length ? parts.join("/") : ""
    if (parts.length > maxDepth) throw new Error(`Maximum folder depth of ${maxDepth} exceeded for ${path}`)
    // register folders along the path
    let running = ""
    parts.forEach((part, idx) => {
      running = idx === 0 ? part : `${running}/${part}`
      if (!folders[running]) {
        folders[running] = { path: running, parentPath: idx === 0 ? "" : running.split("/").slice(0, -1).join("/") }
      }
    })
    files.push({ path, file, name, parentPath })
  })

  const folderList = Object.values(folders).sort((a, b) => depthOf(a.path) - depthOf(b.path))

  const parentIdByPath = new Map<string, string | null>()
  parentIdByPath.set("", rootParentId)

  if (folderList.length) onProgress?.(`Creating ${folderList.length} folders…`)
  await runSequential(folderList, async (folder) => {
    const parentId = parentIdByPath.get(folder.parentPath) ?? null
    const resp = await filesApi.createFile(projectId, {
      parentId,
      name: folder.path.split("/").pop() as string,
      assetType: "folder",
      mimeType: "inode/directory",
      isInline: false,
    })
    parentIdByPath.set(folder.path, resp.fileMetadata.id)
  })

  const inlineFiles = files.filter((f) => isLatex(f.name))
  const binaryFiles = files.filter((f) => !isLatex(f.name))

  if (inlineFiles.length) onProgress?.(`Importing ${inlineFiles.length} inline files…`)
  await runSequential(inlineFiles, async (item, idx) => {
    const parentId = parentIdByPath.get(item.parentPath) ?? null
    const content = await item.file.text()
    if (new TextEncoder().encode(content).length > 2_000_000) {
      throw new Error(`File too large for inline upload: ${item.path}`)
    }
    onProgress?.(`Inline ${idx + 1}/${inlineFiles.length}: ${item.path}`)
    await filesApi.createFile(projectId, {
      parentId,
      name: item.name,
      assetType: "file",
      mimeType: "text/x-tex",
      isInline: true,
      content,
    })
  })

  if (binaryFiles.length) onProgress?.(`Uploading ${binaryFiles.length} assets…`)
  await runSequential(binaryFiles, async (item, idx) => {
    const parentId = parentIdByPath.get(item.parentPath) ?? null
    const mimeType = inferMime(item.name, item.file)
    onProgress?.(`Upload ${idx + 1}/${binaryFiles.length}: ${item.path}`)
    const { fileMetadata, uploadUrl } = await filesApi.createFile(projectId, {
      parentId,
      name: item.name,
      assetType: "file",
      mimeType,
      isInline: false,
    })
    if (!uploadUrl) return
    await filesApi.uploadToSignedUrl(uploadUrl, item.file as Blob)
    await filesApi.finalizeUpload(projectId, fileMetadata.id, "done")
  })

  const fresh = await filesApi.fetchTree(projectId)
  onProgress?.("Import complete")
  return fresh
}
