import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    // Enable HTTPS for WebAuthn on mobile
    https: process.env.HTTPS === 'true' ? {
      key: fs.existsSync('./certs/key.pem') ? fs.readFileSync('./certs/key.pem') : undefined,
      cert: fs.existsSync('./certs/cert.pem') ? fs.readFileSync('./certs/cert.pem') : undefined,
    } : undefined
  },
  build: {
    // Optimize bundle splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate MUI into its own chunk for better caching
          'mui-core': ['@mui/material'],
          'mui-icons': ['@mui/icons-material'],
          'mui-lab': ['@mui/lab'],
          'mui-x': ['@mui/x-data-grid'],
          // Separate other large libraries
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'utils': ['axios', 'date-fns', 'fuse.js']
        }
      }
    },
    // Enable source maps for bundle analysis
    sourcemap: process.env.ANALYZE === 'true'
  }
})
