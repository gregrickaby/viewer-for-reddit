import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import mantine from 'eslint-config-mantine'
import testingLibrary from 'eslint-plugin-testing-library'
import jestDom from 'eslint-plugin-jest-dom'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/',
      '**/.next/',
      '**/.vercel/',
      '**/dist/',
      '**/build/',
      '**/coverage/',
      '**/out/',
      '**/public/',
      '**/*.min.js',
      '**/*.js',
      '**/.*cache/'
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

  // Project rules
  {
    rules: {
      'no-console': ['error', {allow: ['warn', 'error', 'info']}]
    }
  },

  // Testing-specific rules
  // https://github.com/testing-library/eslint-plugin-testing-library
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    plugins: {
      'testing-library': testingLibrary,
      'jest-dom': jestDom
    },
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      ...jestDom.configs['flat/recommended'].rules
    }
  },

  // Prettier rules
  // https://github.com/prettier/eslint-config-prettier
  eslintConfigPrettier
)
