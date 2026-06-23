import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxyTarget = 'https://hackaton-20261-front-587720740455.us-east1.run.app'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/v1': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
