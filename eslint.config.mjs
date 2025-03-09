import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import eslintPluginTestingLibrary from 'eslint-plugin-testing-library'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  eslintPluginPrettierRecommended,
  eslintPluginTestingLibrary.configs['flat/react'],
  {
    rules: {
      '@next/next/no-img-element': 'off'
    }
  }
]

export default eslintConfig
