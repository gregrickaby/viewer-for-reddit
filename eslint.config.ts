import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

const NO_CLIENT_FETCHING = 'Server-first: no client data fetching.'

// Source modules declare their top-level functions. A typed const (`const x: Transformer = ...`) is fine.
const SOURCE_SYNTAX = [
  ...[
    'Program > VariableDeclaration > VariableDeclarator:not([id.typeAnnotation]) > :matches(ArrowFunctionExpression, FunctionExpression).init',
    'Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator:not([id.typeAnnotation]) > :matches(ArrowFunctionExpression, FunctionExpression).init',
  ].map((selector) => ({
    selector,
    message: 'Use a function declaration for top-level functions.',
  })),
  {
    selector: "TSQualifiedName[left.name='React']",
    message: "Import the type from 'react' instead of using the `React` namespace.",
  },
]

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
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      'react/no-danger': 'error',
      'react/jsx-sort-props': 'error',
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: ['swr', '@tanstack/react-query', 'axios'].map((name) => ({
            name,
            message: NO_CLIENT_FETCHING,
          })),
          patterns: [{ group: ['../*'], message: 'Import from another folder with `@/`.' }],
        },
      ],
    },
  },
  {
    files: ['{app,components,lib,scripts,stylelint}/**/*.{ts,tsx}', '*.ts'],
    ignores: ['*.config.ts'],
    rules: { 'no-restricted-syntax': ['error', ...SOURCE_SYNTAX] },
  },
  {
    // Next.js route files and tool configs are loaded by their default export.
    files: [
      'app/**/{page,layout,template,default,error,global-error,not-found,opengraph-image,icon,sitemap,robots,manifest}.{ts,tsx}',
      '*.config.ts',
      'stylelint/**/*.ts',
    ],
    rules: { 'no-restricted-exports': 'off' },
  },
  {
    // The only places allowed to inject HTML: the root layout's no-flash theme
    // script and the sanitized Reddit HTML renderer.
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
              group: ['@/lib/reddit/*', '@/lib/media/*', '@/lib/auth/*', '@/lib/env'],
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
    files: ['lib/reddit/**/*.ts', 'lib/media/**/*.ts', 'lib/auth/**/*.ts', 'lib/env.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...SOURCE_SYNTAX,
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
