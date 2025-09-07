import react from '@vitejs/plugin-react-swc'
import path from 'path'
import {defineConfig} from 'vitest/config'

// https://vitejs.dev/config/
// https://mantine.dev/guides/vitest/
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
    setupFiles: './vitest.setup.ts',
    coverage: {
      enabled: true,
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/*.spec.{ts,tsx}',
        '**/*.test.{ts,tsx}',
        '**/test-utils/**',
        '**/app/**/*.{ts,tsx}',
        '**/types/**',
        '*.config.ts',
        '*.d.ts'
      ],
      reporter: ['text', 'json', 'html']
    }
  }
})
