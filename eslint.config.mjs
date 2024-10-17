import path from 'node:path'
import {fileURLToPath} from 'node:url'
import js from '@eslint/js'
import {FlatCompat} from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  {
    ignores: [
      'node_modules',
      '.pnp',
      '**/.pnp.js',
      '.yarn/install-state.gz',
      'coverage',
      '.next/',
      'out/',
      'build',
      '**/.DS_Store',
      '**/*.pem',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/.env*.local',
      '**/.vercel',
      '**/*.tsbuildinfo',
      '**/next-env.d.ts',
      '**/public/'
    ]
  },
  ...compat.extends('next/core-web-vitals', 'prettier'),
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'no-console': [
        'error',
        {
          allow: ['warn', 'error']
        }
      ]
    }
  }
]
