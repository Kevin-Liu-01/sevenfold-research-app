import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

const isProd = process.env.NODE_ENV === 'production' || process.env.BUILD === 'production';

const basePlugins = [nodeResolve(), commonjs()];

if (isProd) {
  basePlugins.push(terser());
}

const copyStatic = copy({
  targets: [
    { src: 'extension/manifest.json', dest: 'dist/extension' },
    { src: 'extension/popup/**/*.html', dest: 'dist/extension/popup' },
    { src: 'extension/popup/**/*.css', dest: 'dist/extension/popup' }
  ],
  hook: 'writeBundle'
});

export default [
  {
    input: 'extension/background.js',
    output: {
      file: 'dist/extension/background.js',
      format: 'iife',
      sourcemap: !isProd
    },
    plugins: [...basePlugins, copyStatic]
  },
  {
    input: 'extension/content.js',
    output: {
      file: 'dist/extension/content.js',
      format: 'iife',
      sourcemap: !isProd
    },
    plugins: [...basePlugins]
  },
  {
    input: 'extension/popup/popup.js',
    output: {
      file: 'dist/extension/popup/popup.js',
      format: 'iife',
      sourcemap: !isProd
    },
    plugins: [...basePlugins]
  }
];
