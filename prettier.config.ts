import type { Config } from 'prettier'

const config: Config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  // Imports go in three groups: packages (Node built-ins, then Next and React, then the rest),
  // `@/` paths, and same-folder `./` paths.
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
    '<BUILTIN_MODULES>',
    '^(next|react)(/.*)?$',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@/',
    '',
    '^[./]',
  ],
  importOrderTypeScriptVersion: '5.0.0',
}

export default config
