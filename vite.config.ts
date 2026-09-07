import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

function copyExtensionAssetsPlugin() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      // Copy manifest
      const manifestSrc = resolve(__dirname, 'src/manifest.json');
      if (fs.existsSync(manifestSrc)) {
        fs.copyFileSync(manifestSrc, resolve(distDir, 'manifest.json'));
      }

      // Ensure dist/popup/index.html exists
      const popupDir = resolve(distDir, 'popup');
      if (!fs.existsSync(popupDir)) {
        fs.mkdirSync(popupDir, { recursive: true });
      }
      const builtPopupHtml = resolve(distDir, 'src/popup/index.html');
      if (fs.existsSync(builtPopupHtml)) {
        fs.copyFileSync(builtPopupHtml, resolve(popupDir, 'index.html'));
      }

      // Ensure dist/help/index.html exists
      const helpDir = resolve(distDir, 'help');
      if (!fs.existsSync(helpDir)) {
        fs.mkdirSync(helpDir, { recursive: true });
      }
      const builtHelpHtml = resolve(distDir, 'src/help/index.html');
      if (fs.existsSync(builtHelpHtml)) {
        fs.copyFileSync(builtHelpHtml, resolve(helpDir, 'index.html'));
      }

      // Copy icons
      const iconsDist = resolve(distDir, 'icons');
      if (!fs.existsSync(iconsDist)) {
        fs.mkdirSync(iconsDist, { recursive: true });
      }
      const iconsSrc = resolve(__dirname, 'icons');
      if (fs.existsSync(iconsSrc)) {
        for (const file of fs.readdirSync(iconsSrc)) {
          fs.copyFileSync(resolve(iconsSrc, file), resolve(iconsDist, file));
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionAssetsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        help: resolve(__dirname, 'src/help/index.html'),
        content: resolve(__dirname, 'src/content/content.ts'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') return 'content/content.js';
          if (chunkInfo.name === 'service-worker') return 'background/service-worker.js';
          if (chunkInfo.name === 'help') return 'help/help.js';
          return 'popup/[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            if (assetInfo.name.includes('content')) return 'content/content.css';
            if (assetInfo.name.includes('help')) return 'help/help.css';
            return 'popup/[name].[ext]';
          }
          return 'assets/[name].[ext]';
        }
      }
    }
  }
});
