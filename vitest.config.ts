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
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/e2e/**',
      '**/vitest.config.*'
    ],
    coverage: {
      enabled: true,
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/*.spec.{ts,tsx}',
        '**/*.test.{ts,tsx}',
        '**/app/**/*.{ts,tsx}',
        '**/scripts/**',
        '**/test-utils/**',
        '**/tests/e2e/**',
        '**/types/**',
        '*.config.ts',
        '*.d.ts',
        '**/vitest.config.*'
      ],
      reporter: ['text', 'json', 'html']
    }
  }
})
