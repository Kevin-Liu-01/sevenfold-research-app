import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config.js';

const storage = {
  async getItem(key) {
    const stored = await chrome.storage.local.get(key);
    return stored[key] ?? null;
  },
  async setItem(key, value) {
    await chrome.storage.local.set({ [key]: value });
  },
  async removeItem(key) {
    await chrome.storage.local.remove(key);
  }
};

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage,
    storageKey: 'harbor-extension-auth'
  }
});
