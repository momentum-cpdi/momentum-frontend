/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

const healthEndpoint = (): Plugin => ({
  name: 'health-endpoint',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] !== '/health') {
        next()
        return
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = 405
        res.setHeader('Allow', 'GET, HEAD')
        res.end()
        return
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok' }))
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy(),
    healthEndpoint(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
