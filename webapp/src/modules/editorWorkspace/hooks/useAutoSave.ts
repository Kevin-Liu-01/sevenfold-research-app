import { useEffect, useRef } from "react"

export const useAutoSave = (
  saveFn: () => void,
  shouldRun: boolean,
  deps: any[],
  delay = 1000,
) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!shouldRun) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveFn()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRun, delay, saveFn, ...deps])
}
