import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content/main.ts'),
        'job-posting': resolve(__dirname, 'src/content/job-posting-detector.ts'),
        'auth-bridge': resolve(__dirname, 'src/auth-bridge.ts'),
      },
      output: {
        // Background and content scripts must be flat files (not chunked) for MV3 compliance.
        // Content scripts must be self-contained because Chrome injects them directly.
        entryFileNames: (chunk) => {
          if (
            chunk.name === 'background' ||
            chunk.name === 'content' ||
            chunk.name === 'job-posting' ||
            chunk.name === 'auth-bridge'
          ) {
            return '[name].js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
