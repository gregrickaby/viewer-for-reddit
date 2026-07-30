import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import jestDom from 'eslint-plugin-jest-dom'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import testingLibrary from 'eslint-plugin-testing-library'
import {defineConfig} from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  // Ignore patterns
  {
    ignores: [
      '**/*.js',
      '**/*.min.js',
      '**/.*cache/',
      '**/.next/',
      '**/build/',
      '**/coverage/',
      '**/dist/',
      '**/node_modules/',
      '**/out/',
      '**/public/',
      '.claude/**',
      'scripts/**'
    ]
  },

  // Base JS rules
  // https://eslint.org/docs/latest/rules/
  eslint.configs.recommended,

  // TypeScript rules
  // https://typescript-eslint.io/rules/
  ...tseslint.configs.recommended,

  // JSX a11y rules
  // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
  jsxA11y.flatConfigs.recommended,

  // Inlined from eslint-config-mantine (dropped: no eslint 10 support yet)
  // https://github.com/mantinedev/eslint-config-mantine/blob/master/eslint.config.js
  {
    rules: {
      'array-callback-return': 'error',
      'no-duplicate-imports': 'error',
      'no-var': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      curly: 'error',
      'default-case': 'off',
      'default-case-last': 'error',
      'dot-notation': 'error',
      'no-alert': 'error',
      'no-console': 'warn',
      'no-else-return': 'error',
      'no-eval': 'warn',
      'no-lonely-if': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-param-reassign': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-call': 'error',
      'no-useless-constructor': 'error',
      'no-useless-return': 'error',
      'object-shorthand': 'error',
      'operator-assignment': ['error', 'always'],
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'prefer-exponentiation-operator': 'error',
      'prefer-object-has-own': 'error',
      'prefer-promise-reject-errors': 'error',
      'prefer-object-spread': 'error',
      'prefer-template': 'error',
      yoda: 'error',
      radix: 'error',
      eqeqeq: ['error', 'smart'],
      'no-undef': 'off'
    }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-generic-constructors': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/no-redeclare': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-loop-func': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    plugins: {react},
    // pinned, not 'detect': the detect path calls the ESLint <10 context.getFilename()
    // API, which ESLint 10 removed (see eslint-plugin-react/lib/util/version.js)
    settings: {react: {version: '19.2.8'}},
    rules: {
      'react/button-has-type': 'error',
      'react/jsx-boolean-value': 'error',
      'react/jsx-curly-brace-presence': ['error', 'never'],
      'react/jsx-fragments': ['error', 'syntax'],
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/no-children-prop': 'error',
      'react/no-deprecated': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-string-refs': 'error',
      'react/self-closing-comp': 'error',
      'react/void-dom-elements-no-children': 'error'
    }
  },
  {
    rules: {
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      'jsx-a11y/mouse-events-have-key-events': 'off',
      'jsx-a11y/label-has-for': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/anchor-has-content': 'off'
    }
  },

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

  // Restrict direct import of private reddit action helpers outside lib/actions/
  {
    ignores: ['lib/actions/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/actions/reddit/_helpers*'],
              message:
                'Do not import _helpers directly. Import from @/lib/actions/reddit instead.'
            }
          ]
        }
      ]
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

  // Prettier rules
  // https://github.com/prettier/eslint-config-prettier
  eslintConfigPrettier
)
