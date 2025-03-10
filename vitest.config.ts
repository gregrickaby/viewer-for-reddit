import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  test: {
    coverage: {
      enabled: true,
      exclude: [
        '**/*.config.{ts,tsx}',
        '**/*.next/**',
        '**/*.spec.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/tests/**',
        '**/node_modules/**',
        '**/*.types.ts',
        '**/*.d.ts'
      ]
    },
    environment: 'jsdom',
    globals: true,
    mockReset: true,
    setupFiles: ['./tests/setupTests.ts'],
    exclude: [
      '**/node_modules/**',
      '**/*.stories.{ts,tsx}',
      '**/*.spec.{ts,tsx}'
    ]
  }
})
