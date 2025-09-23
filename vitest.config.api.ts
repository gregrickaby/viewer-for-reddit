import react from '@vitejs/plugin-react-swc'
import path from 'path'
import {defineConfig} from 'vitest/config'

/**
 * Vitest configuration for testing API routes in a Node environment.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['app/api/**/*.test.ts'],
    coverage: {
      enabled: true,
      include: ['app/api/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
      reporter: ['text', 'json', 'html']
    }
  }
})
