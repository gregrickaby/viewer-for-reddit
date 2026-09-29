import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import sanitizeHtml from 'sanitize-html'
import { describe, expect, it } from 'vitest'
import { sanitizeRedditHtml } from '@/lib/reddit/sanitize'
import { RAW_DIR, samples } from '@/tests/helpers/fixtures'

/*
 * Faithfulness over real Reddit markdown output: sanitizing must keep every
 * word and every structural element (tables, lists, code, quotes, headings,
 * spoilers, superscript), and emit nothing outside the allowlist.
 */

const STRUCTURE = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'table',
  'tr',
  'th',
  'td',
  'blockquote',
  'pre',
  'code',
  'sup',
  'del',
  'em',
  'strong',
  'hr',
  'br',
]
const ALLOWED = new Set([...STRUCTURE, 'thead', 'tbody', 'sub', 'a', 'span'])

const text = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim()
const count = (html: string, tag: string) =>
  html.match(new RegExp(`<${tag}[\\s/>]`, 'g'))?.length ?? 0
const spoilers = (html: string) => html.match(/class="md-spoiler-text"/g)?.length ?? 0

function htmlFrom(value: unknown, into: string[]): string[] {
  if (Array.isArray(value)) for (const item of value) htmlFrom(item, into)
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if ((key === 'selftext_html' || key === 'body_html') && typeof child === 'string')
        into.push(child)
      else htmlFrom(child, into)
    }
  }
  return into
}

function expectFaithful(corpus: string[]) {
  expect(corpus.length).toBeGreaterThan(0)
  for (const html of corpus) {
    const out = sanitizeRedditHtml(html)
    if (!text(html)) continue
    expect(out, html.slice(0, 120)).not.toBeNull()
    expect(text(out!)).toBe(text(html))
    for (const tag of STRUCTURE)
      expect(count(out!, tag), `<${tag}> in ${html.slice(0, 80)}`).toBe(count(html, tag))
    expect(spoilers(out!)).toBe(spoilers(html))
    const tags = new Set([...out!.matchAll(/<([a-z0-9]+)[\s/>]/g)].map((match) => match[1]!))
    for (const tag of tags) expect(ALLOWED, `unexpected <${tag}>`).toContain(tag)
  }
}

describe('rich text over real Reddit HTML', () => {
  it('keeps the committed self text and comments intact', () => {
    expectFaithful([...htmlFrom(samples('Link'), []), ...htmlFrom(samples('Comment'), [])])
  })

  it.skipIf(!existsSync(RAW_DIR))(
    'keeps every captured post and comment intact (AskReddit, ELI5, …)',
    () => {
      const corpus: string[] = []
      for (const file of readdirSync(RAW_DIR)) {
        htmlFrom(JSON.parse(readFileSync(path.join(RAW_DIR, file), 'utf8')), corpus)
      }
      expect(corpus.length).toBeGreaterThan(1000)
      expectFaithful(corpus)
    },
  )
})
