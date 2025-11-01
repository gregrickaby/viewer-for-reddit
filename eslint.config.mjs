import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import mantine from 'eslint-config-mantine'
import testingLibrary from 'eslint-plugin-testing-library'
import jestDom from 'eslint-plugin-jest-dom'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import {defineConfig} from 'eslint/config'
import playwright from 'eslint-plugin-playwright'

export default defineConfig(
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/',
      '**/.next/',
      '**/dist/',
      '**/build/',
      '**/coverage/',
      '**/out/',
      '**/public/',
      '**/*.min.js',
      '**/*.js',
      '**/.*cache/',
      'scripts/**'
    ]
  },

  // Base JS rules
  // https://eslint.org/docs/latest/rules/
  eslint.configs.recommended,

  // TypeScript rules
  // https://typescript-eslint.io/rules/
  ...tseslint.configs.recommended,

  // Mantine config
  // https://mantine.dev/eslint-config-mantine/
  ...mantine,

  // Language options
  // https://eslint.org/docs/latest/use/configure/migration-guide#configuring-language-options
  [
    {
      languageOptions: {
        parserOptions: {
          tsconfigRootDir: new URL('.', import.meta.url).pathname
        }
      }
    }
  ],

  // Project rules
  {
    rules: {
      'no-console': ['error', {allow: ['warn', 'error', 'info']}],
      '@typescript-eslint/triple-slash-reference': 'off'
    }
  },

  /**
   * Apply testing-library and jest-dom rules to test files only
   *
   * https://github.com/testing-library/eslint-plugin-testing-library
   */
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
    plugins: {
      'testing-library': testingLibrary,
      'jest-dom': jestDom
    },
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      ...jestDom.configs['flat/recommended'].rules
    }
  },

  /**
   * Apply Playwright rules to e2e test files only
   *
   * https://www.npmjs.com/package/eslint-plugin-playwright
   */
  {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**'],
    rules: {
      ...playwright.configs['flat/recommended'].rules
    }
  },

  // Prettier rules
  // https://github.com/prettier/eslint-config-prettier
  eslintConfigPrettier
)
