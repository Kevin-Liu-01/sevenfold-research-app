import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist/extension');

export default defineConfig({
  root,
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(root, 'background.js'),
        content: resolve(root, 'content.js'),
        popup: resolve(root, 'popup/popup.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'popup') {
            return 'popup/popup.js';
          }
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        format: 'es',
        inlineDynamicImports: false,
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: resolve(root, 'manifest.json'), dest: '.' },
        { src: resolve(root, 'popup/index.html'), dest: 'popup' },
        { src: resolve(root, 'popup/styles.css'), dest: 'popup' },
        { src: resolve(root, 'content/shadow-root.html'), dest: 'content' },
      ],
    }),
  ],
});
