import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // `server-only` throws outside a React Server environment; tests run in plain Node.
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    // Node by default; component tests opt into a DOM with `// @vitest-environment happy-dom`.
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup-env.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    // CSS Modules resolve to their plain class names so markup assertions stay readable.
    css: { include: [/\.module\.css$/], modules: { classNameStrategy: 'non-scoped' } },
    coverage: {
      provider: 'v8',
      include: [
        'lib/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'scripts/**/*.ts',
        'stylelint/**/*.mjs',
        'proxy.ts',
      ],
      exclude: [
        // quicktype output: exercised through the curated schemas, not hand-written logic.
        'lib/reddit/schemas/generated.ts',
        '**/*.d.ts',
      ],
      reporter: ['text-summary', 'text', 'html', 'lcov'],
      // Enforced minimums (project requirement). Raising them is fine; lowering them is not.
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
})
