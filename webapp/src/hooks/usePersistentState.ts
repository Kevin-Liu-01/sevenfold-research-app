// This hook provides a way to persist state in localStorage
// and automatically sync it with the localStorage whenever it changes.
// It is used in the same way as useState, but with an additional key for localStorage
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export function usePersistentState<T>(
  key: string,
  initial: T,
) {
  const { user } = useAuth();
  
  const storageKey = user?.id ? `${user.id}:${key}` :  `anon:${key}`;

  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as T) : initial;
    } catch {
      return initial;
    }
  });

  // Sync to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }, [storageKey, state]);

  return [state, setState] as const;
}
