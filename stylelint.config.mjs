/** @type {import('stylelint').Config} */
const config = {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  plugins: ['./stylelint/require-components-layer.mjs'],
  ignoreFiles: ['.next/**', 'coverage/**', 'node_modules/**'],
  rules: {
    'reddit-viewer/require-components-layer': true,
    // CSS Modules are consumed from TS as `styles.fooBar`.
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: 'Use camelCase class names in CSS Modules.' },
    ],
    // Colors come from tokens (app/styles/tokens.css) only.
    'color-no-hex': true,
    'color-named': 'never',
    'declaration-no-important': true,
  },
  overrides: [
    {
      files: ['app/styles/tokens.css'],
      rules: { 'color-no-hex': null },
    },
    {
      // Global styles may target Reddit's own markup classes and state attributes.
      files: ['app/styles/*.css'],
      rules: { 'selector-class-pattern': null },
    },
    {
      // Reduced-motion overrides must beat component animations.
      files: ['app/styles/base.css'],
      rules: { 'declaration-no-important': null },
    },
  ],
}

export default config
