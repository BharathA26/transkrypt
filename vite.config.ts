import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const copyManifestPlugin = () => ({
  name: 'copy-manifest',
  closeBundle() {
    const src = path.resolve(__dirname, 'manifest.json');
    const dest = path.resolve(__dirname, 'dist/manifest.json');
    fs.copyFileSync(src, dest);
    
    // Copy assets folder
    const assetsSrc = path.resolve(__dirname, 'assets');
    const assetsDest = path.resolve(__dirname, 'dist/assets');
    if (fs.existsSync(assetsSrc)) {
      if (!fs.existsSync(assetsDest)) {
        fs.mkdirSync(assetsDest, { recursive: true });
      }
      fs.cpSync(assetsSrc, assetsDest, { recursive: true });
    }
  }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        rollupOptions: {
          input: {
            // Only build the content script for the extension bundle
            content: path.resolve(__dirname, 'content.tsx')
          },
          output: {
            format: 'iife',
            inlineDynamicImports: true,
            entryFileNames: 'content.js',
            assetFileNames: 'assets/[name][extname]'
          }
        }
      },
      plugins: [
        react(),
        copyManifestPlugin()
      ]
    };
});
