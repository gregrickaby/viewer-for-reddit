import react from '@vitejs/plugin-react-swc'
import path from 'path'
import {defineConfig} from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test.setup.ts',
    coverage: {
      enabled: true,
      include: ['**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/__tests__/**'],
      reporter: ['text', 'json', 'html']
    }
  }
})
