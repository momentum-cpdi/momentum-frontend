/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      healthEndpoint(),
    ],
    server: {
      proxy: {
        // Même origine qu'en production : /api est relayé vers le backend local.
        '/api': {
          target: env.DEV_API_PROXY || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/setupTests.ts', 'src/main.tsx', 'src/vite-env.d.ts'],
        thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
      },
    },
  }
})
