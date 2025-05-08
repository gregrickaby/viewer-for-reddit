import path from 'node:path'
import {fileURLToPath} from 'node:url'
import js from '@eslint/js'
import {FlatCompat} from '@eslint/eslintrc'
import testingLibrary from 'eslint-plugin-testing-library'
import jestDom from 'eslint-plugin-jest-dom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

const config = [
  {
    ignores: [
      '.*.js',
      '**/*.min.js',
      '**/.*cache/',
      '**/.next/',
      '**/.vercel/',
      '**/out/',
      '**/dist/',
      '**/build/',
      '**/coverage/',
      '**/node_modules/',
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
          allow: ['warn', 'error', 'info']
        }
      ]
    }
  },
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    ...testingLibrary.configs['flat/react'],
    ...jestDom.configs['flat/recommended']
  }
]

export default config
