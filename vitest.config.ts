import { defineConfig } from 'vitest/config'

export default defineConfig({
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
    setupFiles: ['./tests/utils/setupTests.ts'],
    exclude: [
      '**/node_modules/**',
      '**/*.stories.{ts,tsx}',
      '**/*.spec.{ts,tsx}'
    ]
  }
})
