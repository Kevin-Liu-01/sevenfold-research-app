export const supabaseConfig = {
  url: 'https://rivimoqvqpbypjxfpfhl.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdmltb3F2cXBieXBqeGZwZmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MjUxNjAsImV4cCI6MjA2MzIwMTE2MH0.mOAdRfw3x5CG3SRmhrlbtaGqpMt8_NAHtFNUXIW6ZU4',
  clientId: '1022259647916-0ar725ogba7t3p6p4ovpt7cr4caha5g7.apps.googleusercontent.com',
  defaultProvider: 'google'
};

export const apiConfig = {
  /**
   * Base URL for the Sevenfold API. Replace this with the environment you deploy the backend to.
   */
  baseUrl: 'http://127.0.0.1:8000',
  uploadPath: '/papers/upload-pdf',
  linkPaperPath: '/papers/link-paper',
  processPdfPath: '/papers/process-pdf'
};

/**
 * Update the values above with production Supabase credentials. The redirect URL is generated at
 * runtime via chrome.identity.getRedirectURL so no configuration is required for it here.
 */
