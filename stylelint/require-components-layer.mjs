import stylelint from 'stylelint'

const {
  createPlugin,
  utils: { report, ruleMessages },
} = stylelint

const ruleName = 'reddit-viewer/require-components-layer'
const messages = ruleMessages(ruleName, {
  rejected: 'CSS Module rules must live inside a top-level `@layer components { … }` block.',
})

/**
 * Every rule in a CSS Module must sit inside `@layer components`, so cascade
 * order never depends on import order (docs/design.md §10.4).
 */
const rule = (enabled) => (root, result) => {
  if (!enabled) return
  const file = root.source?.input.file ?? ''
  if (!file.endsWith('.module.css')) return

  for (const node of root.nodes) {
    if (node.type === 'comment') continue
    const isComponentsLayer =
      node.type === 'atrule' && node.name === 'layer' && node.params.trim() === 'components'
    if (!isComponentsLayer) {
      report({ ruleName, result, node, message: messages.rejected })
    }
  }
}

rule.ruleName = ruleName
rule.messages = messages

export default createPlugin(ruleName, rule)
