# Research PDF Chrome Extension

A Chrome extension for collecting research PDFs and uploading them to a Supabase-backed library.

## Getting Started

```bash
npm install
npm run dev # rebuild on change
```

Load the extension via:

1. `npm run build` (or keep `npm run dev` running)
2. Open `chrome://extensions`
3. Enable Developer Mode
4. Click **Load unpacked** and select `dist/extension`

## Packaging

Create a release archive:

```bash
npm run zip
```

This generates `dist/chrome-extension.zip` ready for distribution.
