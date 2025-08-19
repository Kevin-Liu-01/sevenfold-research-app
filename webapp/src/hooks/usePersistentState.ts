// This hook provides a way to persist state in localStorage
// and automatically sync it with the localStorage whenever it changes.
// It is used in the same way as useState, but with an additional key for localStorage

import { useState, useEffect } from "react";

export function usePersistentState<T>(key: string, initial: T) {
    const [state, setState] = useState<T>(() => {
        const saved = localStorage.getItem(key);
        return saved ? (JSON.parse(saved) as T) : initial;
    });

    // Update localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState] as const;
}
