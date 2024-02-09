module.exports = {
  extends: ['next/core-web-vitals', 'prettier'],
  rules: {
    '@next/next/no-img-element': 'off',
    'no-console': ['error', {allow: ['warn', 'error']}]
  }
}
