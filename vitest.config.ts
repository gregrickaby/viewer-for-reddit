import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
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
    setupFiles: ['./__tests__/setupTests.ts'],
    exclude: [
      '**/node_modules/**',
      '**/*.stories.{ts,tsx}',
      '**/*.spec.{ts,tsx}'
    ]
  }
})
