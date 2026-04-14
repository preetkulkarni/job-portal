import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8001',
      '/jobs': 'http://localhost:8001',
      '/applications': 'http://localhost:8001',
      '/search': 'http://localhost:8001',
    }
  }
})