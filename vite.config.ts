import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import vercel from 'vite-plugin-vercel'
import { defineConfig } from 'vitest/config'

/**
 * Vite configuration.
 *
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), vercel()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  base: '/',
  server: {
    port: 3000,
    warmup: {
      clientFiles: ['./src/**/*.{ts,tsx}']
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    mockReset: true,
    setupFiles: ['./tests/utils/setupTests.ts'],
    coverage: {
      enabled: true,
      exclude: ['**/__tests__/**']
    }
  }
})
