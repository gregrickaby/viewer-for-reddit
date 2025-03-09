import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    mockReset: true,
    setupFiles: ['./tests/utils/setupTests.ts'],
    coverage: {
      enabled: true,
      exclude: ['**/tests/**']
    }
  }
})
