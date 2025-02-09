import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import vercel from 'vite-plugin-vercel'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vercel()],
  base: '/',
  server: {
    // Specify dev server port
    port: 3000,
    // Optimize startup time
    warmup: {
      clientFiles: ['./src/**/*.{ts,tsx}']
    }
  },
  test: {
    // Register apis globalally for tests.
    globals: true,
    // Use jsdom for the test environment.
    environment: 'jsdom',
    // Provide a setup file for the test environment.
    setupFiles: ['src/setupTests'],
    // Reset the mock state between tests.
    mockReset: true
  }
})
