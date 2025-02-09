/**
 * @type {import("prettier").Config}
 */
const config = {
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  bracketSpacing: true,
  semi: false,
  trailingComma: 'none',
  plugins: ['prettier-plugin-tailwindcss']
}

export default config
