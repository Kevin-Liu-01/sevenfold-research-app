import type { ImportOptions } from "./importExecutor"
import { importEntries } from "./importExecutor"

export const importDirectory = async (fileList: FileList, options: ImportOptions) => {
  const entries: { path: string; file: File }[] = []
  Array.from(fileList).forEach((file) => {
    const path = file.webkitRelativePath || file.name
    if (!path) return
    entries.push({ path, file })
  })

  return importEntries(entries, options)
}
