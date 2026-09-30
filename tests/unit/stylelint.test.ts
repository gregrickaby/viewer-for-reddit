import stylelint from 'stylelint'
import { describe, expect, it } from 'vitest'
import plugin from '@/stylelint/require-components-layer.mjs'

async function lint(code: string, codeFilename: string, enabled = true) {
  const { results } = await stylelint.lint({
    code,
    codeFilename,
    config: { plugins: [plugin], rules: { 'viewer-for-reddit/require-components-layer': enabled } },
  })
  return results[0]!.warnings.map((w) => w.text)
}

describe('viewer-for-reddit/require-components-layer', () => {
  it('accepts CSS Modules wrapped in @layer components (comments allowed)', async () => {
    expect(
      await lint('/* hi */\n@layer components { .a { color: red; } }', 'x.module.css'),
    ).toEqual([])
  })

  it('rejects top-level rules and other layers in CSS Modules', async () => {
    const warnings = await lint('.a { color: red; }\n@layer base { .b {} }', 'x.module.css')
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toMatch(/@layer components/)
  })

  it('ignores global stylesheets, stdin without a filename, and a disabled rule', async () => {
    expect(await lint('.a { color: red; }', 'app/styles/base.css')).toEqual([])
    expect(await lint('.a { color: red; }', 'x.module.css', false)).toEqual([])
    const { results } = await stylelint.lint({
      code: '.a {}',
      config: { plugins: [plugin], rules: { 'viewer-for-reddit/require-components-layer': true } },
    })
    expect(results[0]!.warnings).toEqual([])
  })
})
