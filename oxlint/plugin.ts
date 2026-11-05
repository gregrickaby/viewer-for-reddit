import { definePlugin, defineRule, type ESTree } from '@oxlint/plugins'

type Attribute = ESTree.JSXAttributeItem

function getPropName(attribute: ESTree.JSXAttribute): string {
  const { name } = attribute
  return name.type === 'JSXNamespacedName' ? `${name.namespace.name}:${name.name.name}` : name.name
}

/**
 * Source modules declare their top-level functions. A typed const
 * (`const rule: Rule = ...`) is fine.
 */
const functionDeclarations = defineRule({
  meta: {
    type: 'suggestion',
    docs: { description: 'Use a function declaration for top-level functions.' },
    messages: { declare: 'Use a function declaration for top-level functions.' },
  },
  create(context) {
    function check(node: ESTree.VariableDeclarator) {
      if (node.id.type === 'Identifier' && node.id.typeAnnotation) return
      const init = node.init?.type
      if (init === 'ArrowFunctionExpression' || init === 'FunctionExpression') {
        context.report({ node, messageId: 'declare' })
      }
    }
    return {
      'Program > VariableDeclaration > VariableDeclarator': check,
      'Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator': check,
    }
  },
})

/** Types come from `import type { ReactNode } from 'react'`, not `React.ReactNode`. */
const noReactNamespace = defineRule({
  meta: {
    type: 'suggestion',
    docs: { description: 'Import React types by name.' },
    messages: { named: "Import the type from 'react' instead of using the `React` namespace." },
  },
  create(context) {
    return {
      TSQualifiedName(node) {
        if (node.left.type === 'Identifier' && node.left.name === 'React') {
          context.report({ node, messageId: 'named' })
        }
      },
    }
  },
})

/**
 * JSX props in alphabetical order, compared by code point. A spread starts a new
 * group, because moving a prop across it changes which value wins.
 */
const jsxSortProps = defineRule({
  meta: {
    type: 'layout',
    fixable: 'code',
    docs: { description: 'Sort JSX props alphabetically.' },
    messages: { sort: 'Sort JSX props alphabetically: `{{name}}` goes before `{{previous}}`.' },
  },
  create(context) {
    function checkGroup(group: ESTree.JSXAttribute[]) {
      const names = group.map(getPropName)
      const index = names.findIndex((name, i) => i > 0 && (names[i - 1] as string) > name)
      if (index < 0) return
      const attribute = group[index] as ESTree.JSXAttribute
      const sorted = group.toSorted((a, b) => {
        const [x, y] = [getPropName(a), getPropName(b)]
        return x < y ? -1 : 1
      })
      context.report({
        node: attribute,
        messageId: 'sort',
        data: { name: names[index], previous: names[index - 1] },
        fix: (fixer) =>
          group.map((original, i) =>
            fixer.replaceText(original, context.sourceCode.getText(sorted[i])),
          ),
      })
    }
    return {
      JSXOpeningElement(node) {
        let group: ESTree.JSXAttribute[] = []
        for (const attribute of node.attributes as Attribute[]) {
          if (attribute.type === 'JSXSpreadAttribute') {
            checkGroup(group)
            group = []
          } else {
            group.push(attribute)
          }
        }
        checkGroup(group)
      },
    }
  },
})

/** Server modules import `server-only`, so a client bundle can't pull them in. */
const requireServerOnly = defineRule({
  meta: {
    type: 'problem',
    docs: { description: 'Server modules import `server-only`.' },
    messages: { missing: "Add `import 'server-only'` to server modules." },
  },
  create(context) {
    return {
      Program(node) {
        const imported = node.body.some(
          (statement) =>
            statement.type === 'ImportDeclaration' && statement.source.value === 'server-only',
        )
        if (!imported) context.report({ node, messageId: 'missing' })
      },
    }
  },
})

/** The repo's own lint rules, for what Oxlint's built-in rules don't cover. */
export default definePlugin({
  meta: { name: 'viewer-for-reddit' },
  rules: {
    'function-declarations': functionDeclarations,
    'jsx-sort-props': jsxSortProps,
    'no-react-namespace': noReactNamespace,
    'require-server-only': requireServerOnly,
  },
})
