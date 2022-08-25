module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: ['mantine', 'plugin:@next/next/recommended', 'prettier'],
  plugins: ['prettier'],
  rules: {
    '@next/next/no-img-element': 'off',
    'import/extensions': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'react/react-in-jsx-scope': 'off',
  },
};
