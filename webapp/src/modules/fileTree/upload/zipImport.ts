import JSZip from "jszip"
import type { ImportOptions } from "./importExecutor"
import { importEntries } from "./importExecutor"

export const importZip = async (file: File, options: ImportOptions) => {
  const zip = new JSZip()
  const loaded = await zip.loadAsync(file)

  const entries = await Promise.all(
    Object.keys(loaded.files)
      .filter((name) => {
        const entry = loaded.files[name]
        if (entry.dir) return false
        if (name.startsWith("__MACOSX") || name.split("/").some((p) => p.startsWith("."))) return false
        return true
      })
      .map(async (name) => {
        const entry = loaded.files[name]
        const blob = await entry.async("blob")
        return { path: name, file: blob as Blob }
      }),
  )

  return importEntries(entries, options)
}
