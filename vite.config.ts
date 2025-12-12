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
  }
})
