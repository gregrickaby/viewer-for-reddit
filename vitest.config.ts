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
      '**/.{idea,git,cache,output,temp}/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/tests/e2e/**',
      '**/vitest.config.*',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
    coverage: {
      enabled: true,
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/*.config.*',
        '**/*.{spec,test}.{ts,tsx}',
        '**/app/**/{page,layout,manifest,robots,sitemap,global-not-found}.{ts,tsx}',
        '**/scripts/**',
        '**/test-utils/**',
        '**/types/**',
        '**/*.d.ts'
      ],
      reporter: ['text', 'json', 'html']
    }
  }
})
