import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const NO_CLIENT_FETCHING = 'Server-first: no client data fetching (docs/design.md §4.1).'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-plugin-react's version auto-detection calls an API removed in ESLint 10.
    settings: { react: { version: '19.3' } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'react/no-danger': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: ['swr', '@tanstack/react-query', 'axios'].map((name) => ({
            name,
            message: NO_CLIENT_FETCHING,
          })),
        },
      ],
    },
  },
  {
    // The only places allowed to inject HTML: the root layout's no-flash theme
    // script and the sanitized Reddit HTML renderer (docs/design.md §7, §8.8).
    files: ['app/layout.tsx', 'components/reddit-html.tsx'],
    rules: { 'react/no-danger': 'off' },
  },
  {
    // Client islands: no network access, no server modules (type imports are fine).
    files: ['components/islands/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': ['error', 'fetch', 'XMLHttpRequest', 'EventSource', 'WebSocket'],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/reddit/*', '@/lib/auth/*', '@/lib/env'],
              allowTypeImports: true,
              message: 'Islands may only import types from server modules.',
            },
          ],
        },
      ],
    },
  },
  {
    // Server-only modules must say so.
    files: ['lib/reddit/**/*.ts', 'lib/auth/**/*.ts', 'lib/env.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Program:not(:has(ImportDeclaration[source.value='server-only']))",
          message: "Add `import 'server-only'` to server modules.",
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    '**/*.module.css.d.ts',
  ]),
])

export default eslintConfig
