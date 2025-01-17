module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-deprecated': [
      true,
      {
        ignoreAtRules: ['apply', 'variants', 'responsive', 'screen']
      }
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind']
      }
    ],
    'no-descending-specificity': null,
    'selector-class-pattern': null
  }
}
