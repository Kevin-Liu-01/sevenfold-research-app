// Clears all localStorage keys for a given userId once they sign out
// This way we avoid leaking user data / preferences across sessions
export function clearUserPersistentState(userId: string) {
    const prefix = `${userId}:`;
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
        }
    });
}
