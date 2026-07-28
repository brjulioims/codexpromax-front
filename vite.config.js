import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
      port:1997,
      strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9000/',
        //target: 'https://marital-disbelief-ascent.ngrok-free.dev/',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
