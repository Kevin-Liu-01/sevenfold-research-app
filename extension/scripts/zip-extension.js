#!/usr/bin/env node

const { execSync } = require('node:child_process');
const { existsSync, rmSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

const distDir = join(__dirname, '..', 'dist');
const extensionDir = join(distDir, 'extension');
const zipPath = join(distDir, 'chrome-extension.zip');

if (!existsSync(extensionDir)) {
  console.error('Build output not found. Run "npm run build" first.');
  process.exitCode = 1;
  process.exit();
}

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

if (existsSync(zipPath)) {
  rmSync(zipPath);
}

typeCheckZip();

function typeCheckZip() {
  try {
    execSync('zip --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('zip command not found. Please install zip or adjust scripts/zip-extension.js');
    process.exitCode = 1;
    process.exit();
  }
}

execSync('cd dist && zip -r chrome-extension.zip extension', {
  stdio: 'inherit'
});

console.log('Created dist/chrome-extension.zip');
