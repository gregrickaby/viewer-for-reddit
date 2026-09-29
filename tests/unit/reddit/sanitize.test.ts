import { describe, expect, it } from 'vitest'
import { resolveRedditLink } from '@/lib/reddit/links'
import { sanitizeRedditHtml } from '@/lib/reddit/sanitize'

describe('sanitizeRedditHtml: XSS', () => {
  it.each([
    ['<script>alert(1)</script><p>ok</p>', '<p>ok</p>'],
    ['<img src=x onerror=alert(1)>', null],
    ['<p onclick="alert(1)">hi</p>', '<p>hi</p>'],
    ['<p style="position:fixed">hi</p>', '<p>hi</p>'],
    ['<svg><script>alert(1)</script></svg>', null],
    ['<iframe src="https://evil.com"></iframe>', null],
    ['<object data="x"></object><embed src="x">', null],
    ['<form action="https://evil.com"><input></form>', null],
    ['<style>body{display:none}</style>', null],
  ])('strips %s', (input, expected) => {
    expect(sanitizeRedditHtml(input)).toBe(expected)
  })

  it.each([
    '<a href="javascript:alert(1)">x</a>',
    '<a href="JaVaScRiPt:alert(1)">x</a>',
    '<a href=" javascript:alert(1)">x</a>',
    '<a href="&#106;avascript:alert(1)">x</a>',
    '<a href="jav&#x09;ascript:alert(1)">x</a>',
    '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    '<a href="vbscript:msgbox(1)">x</a>',
  ])('neutralizes dangerous href %s', (input) => {
    const out = sanitizeRedditHtml(input) ?? ''
    expect(out).not.toMatch(/javascript|vbscript|data:/i)
    expect(out).toContain('x')
  })
})

describe('sanitizeRedditHtml: Reddit markdown output', () => {
  it('unwraps Reddit’s md wrapper and drops SC_OFF comments', () => {
    const html =
      '<!-- SC_OFF --><div class="md"><p>Hello <strong>world</strong></p></div><!-- SC_ON -->'
    expect(sanitizeRedditHtml(html)).toBe('<p>Hello <strong>world</strong></p>')
  })

  it('keeps tables with alignment only from the allowlist', () => {
    const html =
      '<table><thead><tr><th align="center">a</th></tr></thead><tbody><tr><td align="evil">b</td></tr></tbody></table>'
    expect(sanitizeRedditHtml(html)).toBe(
      '<table><thead><tr><th align="center">a</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table>',
    )
  })

  it('keeps code, quotes, lists, superscript and strikethrough', () => {
    const html =
      '<pre><code>const x = 1</code></pre><blockquote><p>q</p></blockquote><ol start="3"><li>a</li></ol><p><sup>up</sup> <del>gone</del></p>'
    expect(sanitizeRedditHtml(html)).toBe(html)
  })

  it('makes spoilers keyboard accessible', () => {
    expect(sanitizeRedditHtml('<p><span class="md-spoiler-text">Snape</span></p>')).toBe(
      '<p><span class="md-spoiler-text" tabindex="0" role="button" aria-label="Spoiler, activate to reveal">Snape</span></p>',
    )
  })

  it('turns links without an href or with an unsafe one into plain text', () => {
    expect(sanitizeRedditHtml('<a>anchor</a>')).toBe('<span>anchor</span>')
    expect(sanitizeRedditHtml('<a href="http://[bad">bad</a>')).toBe('<span>bad</span>')
  })

  it('strips classes from other spans', () => {
    expect(sanitizeRedditHtml('<span class="evil md-spoiler-text-x">t</span>')).toBe(
      '<span>t</span>',
    )
  })

  it('returns null for empty output', () => {
    expect(sanitizeRedditHtml('')).toBeNull()
    expect(sanitizeRedditHtml(null)).toBeNull()
    expect(sanitizeRedditHtml('<!-- SC_OFF --><div class="md"></div>')).toBeNull()
  })
})

describe('sanitizeRedditHtml: links', () => {
  it('rewrites Reddit links to internal routes', () => {
    expect(sanitizeRedditHtml('<a href="/r/nextjs">r/nextjs</a>')).toBe(
      '<a href="/r/nextjs">r/nextjs</a>',
    )
    expect(sanitizeRedditHtml('<a href="/u/spez">u/spez</a>')).toBe(
      '<a href="/user/spez">u/spez</a>',
    )
  })

  it('opens external links safely in a new tab', () => {
    expect(sanitizeRedditHtml('<a href="https://example.com/a?b=1">e</a>')).toBe(
      '<a href="https://example.com/a?b=1" target="_blank" rel="noopener noreferrer nofollow ugc">e</a>',
    )
  })
})

describe('resolveRedditLink', () => {
  it.each([
    ['/r/pics', '/r/pics'],
    ['https://www.reddit.com/r/pics/', '/r/pics'],
    ['https://old.reddit.com/r/pics/comments/abc123/a_title/', '/r/pics/comments/abc123/a_title'],
    [
      'https://www.reddit.com/r/pics/comments/abc123/a_title/def456/?context=3',
      '/r/pics/comments/abc123/a_title/def456?context=3',
    ],
    ['https://np.reddit.com/u/spez', '/user/spez'],
    ['/user/spez/m/news', '/user/spez/m/news'],
  ])('internalizes %s', (input, expected) => {
    expect(resolveRedditLink(input)).toEqual({ href: expected, internal: true })
  })

  it.each([
    ['/r/pics/wiki/index', 'https://www.reddit.com/r/pics/wiki/index'],
    ['http://old.reddit.com/message/compose', 'https://www.reddit.com/message/compose'],
    ['https://redd.it/abc123', 'https://redd.it/abc123'],
    ['https://example.com', 'https://example.com/'],
  ])('keeps %s external', (input, expected) => {
    expect(resolveRedditLink(input)).toEqual({ href: expected, internal: false })
  })

  it('does not treat look-alike hosts as Reddit', () => {
    expect(resolveRedditLink('https://reddit.com.evil.com/r/pics')).toEqual({
      href: 'https://reddit.com.evil.com/r/pics',
      internal: false,
    })
  })

  it('keeps mailto links external', () => {
    expect(resolveRedditLink('mailto:mod@example.com')).toEqual({
      href: 'mailto:mod@example.com',
      internal: false,
    })
  })

  it('rejects unparseable URLs', () => {
    expect(resolveRedditLink('http://[bad')).toBeNull()
  })

  it('rejects non-web schemes', () => {
    expect(resolveRedditLink('javascript:alert(1)')).toBeNull()
    expect(resolveRedditLink('ftp://example.com')).toBeNull()
  })
})
