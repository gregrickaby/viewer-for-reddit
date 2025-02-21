import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import vercel from 'vite-plugin-vercel'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vercel()],
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
    setupFiles: ['./setupTests.ts'],
    coverage: {
      enabled: true,
      exclude: ['**/__tests__/**']
    }
  }
})
