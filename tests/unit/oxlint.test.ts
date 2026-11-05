import { RuleTester } from 'oxlint/plugins-dev'
import { describe, it } from 'vitest'

import plugin from '@/oxlint/plugin'

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })
const { rules } = plugin

tester.run('viewer-for-reddit/function-declarations', rules['function-declarations']!, {
  valid: [
    'function a() {}',
    'export function a() {}',
    'const rule: Rule = () => {}',
    'const n = 1',
    'let a',
    'const { a } = b',
    'function a() { const b = () => {} }',
    'items.map((item) => item)',
  ],
  invalid: [
    { code: 'const a = () => {}', errors: [{ messageId: 'declare' }] },
    { code: 'const a = function () {}', errors: [{ messageId: 'declare' }] },
    { code: 'export const a = () => {}', errors: [{ messageId: 'declare' }] },
  ],
})

tester.run('viewer-for-reddit/no-react-namespace', rules['no-react-namespace']!, {
  valid: [
    "import type { ReactNode } from 'react'; let a: ReactNode",
    'let a: Foo.Bar',
    'let a: A.B.C',
  ],
  invalid: [{ code: 'let a: React.ReactNode', errors: [{ messageId: 'named' }] }],
})

tester.run('viewer-for-reddit/jsx-sort-props', rules['jsx-sort-props']!, {
  valid: [
    '<a />',
    '<a href="/" title="t" />',
    '<a aria-label="l" href="/" />',
    '<a Z="1" a="2" />',
    '<a z="1" {...rest} a="2" />',
    '<svg xlink:href="#a" y="1" />',
  ],
  invalid: [
    {
      code: '<a title="t" href="/" />',
      output: '<a href="/" title="t" />',
      errors: [{ messageId: 'sort', data: { name: 'href', previous: 'title' } }],
    },
    {
      code: '<a c="3" b="2" {...rest} z="1" y="0" />',
      output: '<a b="2" c="3" {...rest} y="0" z="1" />',
      errors: [{ messageId: 'sort' }, { messageId: 'sort' }],
    },
    {
      code: '<a b="2" c="3" a="1" />',
      output: '<a a="1" b="2" c="3" />',
      errors: [{ messageId: 'sort', data: { name: 'a', previous: 'c' } }],
    },
    {
      code: '<svg y="1" xlink:href="#a" />',
      output: '<svg xlink:href="#a" y="1" />',
      errors: [{ messageId: 'sort', data: { name: 'xlink:href', previous: 'y' } }],
    },
  ],
})

tester.run('viewer-for-reddit/require-server-only', rules['require-server-only']!, {
  valid: ["import 'server-only'\nexport const a = 1", "import { a } from 'server-only'"],
  invalid: [{ code: 'export const a = 1', errors: [{ messageId: 'missing' }] }],
})
