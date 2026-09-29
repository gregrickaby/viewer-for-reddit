import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * WCAG AA contrast for every semantic color pair, in both themes
 * (docs/design.md §10.4, docs/implementation.md §3.1).
 */

const css = readFileSync(
  fileURLToPath(new URL('../../app/styles/tokens.css', import.meta.url)),
  'utf8',
)

const declarations = new Map<string, string>()
for (const match of css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
  declarations.set(match[1]!, match[2]!.trim())
}

type Theme = 'light' | 'dark'

function resolve(token: string, theme: Theme): string {
  const raw = declarations.get(token)
  if (!raw) throw new Error(`Unknown token ${token}`)
  return resolveValue(raw, theme)
}

function resolveValue(value: string, theme: Theme): string {
  const lightDark = /^light-dark\((.+)\)$/.exec(value)
  if (lightDark) {
    const [light, dark] = splitArgs(lightDark[1]!)
    return resolveValue(theme === 'light' ? light! : dark!, theme)
  }
  const variable = /^var\((--[a-z0-9-]+)\)$/.exec(value)
  if (variable) return resolve(variable[1]!, theme)
  return value
}

function splitArgs(args: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of args) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current.trim())
  return parts
}

function luminance(hex: string): number {
  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  const channels = [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const TEXT = 4.5
const UI = 3

const pairs: Array<[foreground: string, background: string, minimum: number]> = [
  ['--text-1', '--surface-page', TEXT],
  ['--text-1', '--surface-card', TEXT],
  ['--text-2', '--surface-card', TEXT],
  ['--text-3', '--surface-card', TEXT],
  ['--text-3', '--surface-page', TEXT],
  ['--accent', '--surface-card', TEXT],
  ['--accent', '--surface-page', TEXT],
  ['--accent-contrast', '--accent-fill', TEXT],
  ['--accent-contrast', '--accent-fill-hover', TEXT],
  ['--upvote', '--surface-card', TEXT],
  ['--downvote', '--surface-card', TEXT],
  ['--danger', '--surface-card', TEXT],
  ['--nsfw', '--surface-card', TEXT],
  ['--focus-ring', '--surface-page', UI],
  ['--border-strong', '--surface-card', UI],
]

describe.each<Theme>(['light', 'dark'])('%s theme contrast', (theme) => {
  it.each(pairs)('%s on %s ≥ %d:1', (foreground, background, minimum) => {
    const ratio = contrast(resolve(foreground, theme), resolve(background, theme))
    expect(ratio, `${foreground} on ${background} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      minimum,
    )
  })
})
