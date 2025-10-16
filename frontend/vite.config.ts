import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  envDir: '../',
  server: {
    port: 5173,
    open: true,
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin'
    },
    allowedHosts: ['culturistas.stuns.org', 'localhost:8081']
  },
  build: {
    target: 'esnext',
    minify: 'esbuild'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
})
